import { join, dirname, extname, basename } from "path";
import { randomUUID } from "crypto";
import { mkdirSync, existsSync } from "fs";
import type { DataSource, Repository } from "typeorm";
import { db } from "../../lib/db";
import { Media, type ContentRating } from "../library/entity";
import { generateThumbnail } from "../library/operations/scan/thumbnail";
import { findAvailablePath, type ShootInfo } from "../library/managed-path";
import { resolveMediaPath } from "../library/path-utils";
import { Shoot } from "../shoots/entity";
import { MediaEdit, type MediaEditStatus } from "./entity";
import type { MediaType } from "../library/entity";

const log = (msg: string, data?: Record<string, unknown>) =>
  console.log(`[render] ${msg}`, data ? JSON.stringify(data) : "");

export type RenderProgress = {
  renderedFrames: number;
  totalFrames: number;
};

export type RenderResult = {
  type: MediaType;
  duration: number | null;
  size: number;
};

export type RenderFn = (params: {
  edit: MediaEdit;
  sourceMedia: Media;
  outputPath: string;
  quality?: string;
  onProgress?: (progress: RenderProgress) => void;
}) => Promise<RenderResult>;

export type ProcessResult = {
  editId: string;
  outputMediaId: string;
};

export type ProcessFailure = {
  editId: string;
  error: string;
};

// ---------------------------------------------------------------------------
// Sub-steps (internal helpers)
// ---------------------------------------------------------------------------

const pickupNextEdit = async (
  editRepo: Repository<MediaEdit>,
): Promise<MediaEdit | null> => {
  const edit = await editRepo.findOne({
    where: { status: "queued" },
    order: { createdAt: "ASC" },
  });
  return edit ?? null;
};

const loadSourceMedia = async (
  mediaRepo: Repository<Media>,
  sourceMediaId: string,
): Promise<Media | null> =>
  mediaRepo.findOne({
    where: { id: sourceMediaId },
    relations: { shoots: true },
  });

const transitionStatus = async (
  editRepo: Repository<MediaEdit>,
  edit: MediaEdit,
  status: MediaEditStatus,
  result?: { outputMediaId?: string; error?: string },
): Promise<void> => {
  edit.status = status;
  edit.outputMediaId = result?.outputMediaId ?? edit.outputMediaId;
  edit.error = result?.error ?? null;
  await editRepo.save(edit);
};

// ---------------------------------------------------------------------------
// Path resolution (exported for testing and reuse)
// ---------------------------------------------------------------------------

export const resolveManagedPath = async (
  sourceMedia: Media,
  edit: MediaEdit,
): Promise<string> => {
  const sourceExt = extname(sourceMedia.name) || ".mp4";
  const shoot: ShootInfo = sourceMedia.shoots?.[0] ?? {
    name: basename(sourceMedia.name, sourceExt),
    shootDate: new Date(),
  };
  return findAvailablePath(
    shoot,
    edit.package ?? "",
    edit.role ?? "",
    edit.contentRating ?? "",
    sourceExt,
  );
};

export const resolveUnmanagedPath = (sourceMedia: Media): string => {
  const sourceExt = extname(sourceMedia.name) || ".mp4";
  const sourceDir = dirname(sourceMedia.relativePath);
  const outputFilename = `${basename(sourceMedia.name, sourceExt)}_edit_${randomUUID().slice(0, 8)}${sourceExt}`;
  return join(sourceDir, outputFilename);
};

export const resolveOutputPath = async (
  sourceMedia: Media,
  edit: MediaEdit,
): Promise<string> => {
  const hasMetadata = edit.package && edit.role && edit.contentRating;
  return hasMetadata
    ? resolveManagedPath(sourceMedia, edit)
    : resolveUnmanagedPath(sourceMedia);
};

// ---------------------------------------------------------------------------
// Result handling
// ---------------------------------------------------------------------------

const createOutputMedia = async (
  mediaRepo: Repository<Media>,
  sourceMedia: Media,
  edit: MediaEdit,
  outputRelativePath: string,
  outputFullPath: string,
  result: RenderResult,
): Promise<Media> => {
  const fileExists = existsSync(outputFullPath);
  const outputSize = fileExists ? Bun.file(outputFullPath).size : result.size;

  if (!fileExists) {
    log("WARNING: output file does not exist after render", { outputFullPath });
  }

  const hasMetadata = edit.package && edit.role && edit.contentRating;
  const outputMedia = mediaRepo.create({
    relativePath: outputRelativePath,
    name: basename(outputRelativePath),
    type: result.type,
    size: outputSize,
    duration: result.duration,
    derivedFromId: sourceMedia.id,
    package: edit.package ?? null,
    role: edit.role ?? null,
    contentRating: (edit.contentRating as ContentRating) ?? null,
    isManaged: !!hasMetadata,
    fileCreationDate: new Date(),
    fileModificationDate: new Date(),
  });
  return mediaRepo.save(outputMedia);
};

const tryGenerateThumbnail = async (
  outputFullPath: string,
  outputMedia: Media,
  result: RenderResult,
): Promise<void> => {
  try {
    await generateThumbnail(outputFullPath, outputMedia.id, result.type);
    log("thumbnail generated", { outputMediaId: outputMedia.id });
  } catch (thumbErr) {
    log("thumbnail generation failed (non-fatal)", {
      outputMediaId: outputMedia.id,
      error: thumbErr instanceof Error ? thumbErr.message : String(thumbErr),
    });
  }
};

const linkToShoot = async (
  database: DataSource,
  sourceMedia: Media,
  outputMedia: Media,
): Promise<void> => {
  const sourceShoot = sourceMedia.shoots?.[0];
  if (!sourceShoot) return;

  const shootRepo = database.getRepository(Shoot);
  const shoot = await shootRepo.findOne({
    where: { id: sourceShoot.id },
    relations: { media: true },
  });
  if (shoot) {
    shoot.media.push(outputMedia);
    await shootRepo.save(shoot);
    log("linked output to shoot", { shootId: shoot.id, shootName: shoot.name });
  }
};

// ---------------------------------------------------------------------------
// Orchestrator (public interface — unchanged)
// ---------------------------------------------------------------------------

/**
 * Finds the next queued MediaEdit (oldest first), transitions it to rendering,
 * executes the render function, creates an output Media entity, and links them.
 *
 * Returns null if no queued edits exist.
 */
export const processNextQueuedEdit = async (
  renderFn: RenderFn,
  onProgress?: (editId: string, progress: RenderProgress) => void,
): Promise<ProcessResult | ProcessFailure | null> => {
  const database = await db();
  const editRepo = database.getRepository(MediaEdit);
  const mediaRepo = database.getRepository(Media);

  // 1. Pick up next queued edit
  const edit = await pickupNextEdit(editRepo);
  if (!edit) return null;

  log("picked up edit", {
    editId: edit.id,
    type: edit.type,
    sourceMediaId: edit.sourceMediaId,
    package: edit.package,
    role: edit.role,
    contentRating: edit.contentRating,
    quality: edit.quality,
  });

  // 2. Transition to rendering
  await transitionStatus(editRepo, edit, "rendering");

  // 3. Load source media
  const sourceMedia = await loadSourceMedia(mediaRepo, edit.sourceMediaId);
  if (!sourceMedia) {
    const error = `Source media ${edit.sourceMediaId} not found`;
    log("source media not found", { sourceMediaId: edit.sourceMediaId });
    await transitionStatus(editRepo, edit, "failed", { error });
    return { editId: edit.id, error };
  }

  log("loaded source media", {
    name: sourceMedia.name,
    type: sourceMedia.type,
    relativePath: sourceMedia.relativePath,
    shoots: sourceMedia.shoots?.map((s) => s.name) ?? [],
  });

  // 4. Resolve output path
  const outputRelativePath = await resolveOutputPath(sourceMedia, edit);
  const outputFullPath = resolveMediaPath(outputRelativePath);

  log("output path resolved", { outputRelativePath, outputFullPath });

  // Ensure output directory exists
  const outputDir = dirname(outputFullPath);
  if (!existsSync(outputDir)) {
    log("creating output directory", { outputDir });
    mkdirSync(outputDir, { recursive: true });
  }

  try {
    // 5. Render
    log("starting render", { editId: edit.id, quality: edit.quality });

    const result = await renderFn({
      edit,
      sourceMedia,
      outputPath: outputFullPath,
      quality: edit.quality ?? undefined,
      onProgress: onProgress ? (progress) => onProgress(edit.id, progress) : undefined,
    });

    log("render completed", {
      editId: edit.id,
      type: result.type,
      duration: result.duration,
      size: result.size,
    });

    // 6. Handle result: create output media, thumbnail, shoot link
    const outputMedia = await createOutputMedia(
      mediaRepo, sourceMedia, edit, outputRelativePath, outputFullPath, result,
    );

    log("output media created", { outputMediaId: outputMedia.id, name: outputMedia.name });

    await tryGenerateThumbnail(outputFullPath, outputMedia, result);
    await linkToShoot(database, sourceMedia, outputMedia);

    // 7. Transition to completed
    await transitionStatus(editRepo, edit, "completed", {
      outputMediaId: outputMedia.id,
    });

    log("edit completed", { editId: edit.id, outputMediaId: outputMedia.id });

    return { editId: edit.id, outputMediaId: outputMedia.id };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    log("render FAILED", { editId: edit.id, error: errorMsg, stack });

    await transitionStatus(editRepo, edit, "failed", { error: errorMsg });
    return { editId: edit.id, error: errorMsg };
  }
};
