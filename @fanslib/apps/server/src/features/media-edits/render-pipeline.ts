import { join, dirname, extname, basename } from "path";
import { randomUUID } from "crypto";
import { mkdirSync, existsSync } from "fs";
import { db } from "../../lib/db";
import { Media } from "../library/entity";
import { MediaEdit } from "./entity";
import type { MediaType } from "../library/entity";

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
  onProgress?: (progress: RenderProgress) => void;
}) => Promise<RenderResult>;

export type ProcessResult = {
  editId: string;
  outputMediaId: string;
};

/**
 * Finds the next queued MediaEdit (oldest first), transitions it to rendering,
 * executes the render function, creates an output Media entity, and links them.
 *
 * Returns null if no queued edits exist.
 */
export const processNextQueuedEdit = async (
  renderFn: RenderFn,
  onProgress?: (editId: string, progress: RenderProgress) => void,
): Promise<ProcessResult | null> => {
  const database = await db();
  const editRepo = database.getRepository(MediaEdit);
  const mediaRepo = database.getRepository(Media);

  // Find oldest queued edit
  const edit = await editRepo.findOne({
    where: { status: "queued" },
    order: { createdAt: "ASC" },
  });

  if (!edit) return null;

  // Transition to rendering
  edit.status = "rendering";
  await editRepo.save(edit);

  // Load source media
  const sourceMedia = await mediaRepo.findOne({ where: { id: edit.sourceMediaId } });
  if (!sourceMedia) {
    edit.status = "failed";
    edit.error = `Source media ${edit.sourceMediaId} not found`;
    await editRepo.save(edit);
    return null;
  }

  // Determine output path — place next to source file
  const sourceDir = dirname(sourceMedia.relativePath);
  const sourceExt = extname(sourceMedia.name) || ".png";
  const outputFilename = `${basename(sourceMedia.name, sourceExt)}_edit_${randomUUID().slice(0, 8)}${sourceExt}`;
  const outputRelativePath = join(sourceDir, outputFilename);

  // Resolve the full path using MEDIA_PATH
  const mediaBasePath = process.env.MEDIA_PATH ?? process.env.LIBRARY_PATH ?? "";
  const outputFullPath = join(mediaBasePath, outputRelativePath);

  // Ensure output directory exists
  const outputDir = dirname(outputFullPath);
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

  try {
    const result = await renderFn({
      edit,
      sourceMedia,
      outputPath: outputFullPath,
      onProgress: onProgress ? (progress) => onProgress(edit.id, progress) : undefined,
    });

    // Determine output file size from rendered result
    const outputSize = existsSync(outputFullPath) ? Bun.file(outputFullPath).size : result.size;

    // Create output Media entity
    const outputMedia = mediaRepo.create({
      relativePath: outputRelativePath,
      name: outputFilename,
      type: result.type,
      size: outputSize,
      duration: result.duration,
      derivedFromId: sourceMedia.id,
      fileCreationDate: new Date(),
      fileModificationDate: new Date(),
    });
    await mediaRepo.save(outputMedia);

    // Link edit to output
    edit.status = "completed";
    edit.outputMediaId = outputMedia.id;
    edit.error = null;
    await editRepo.save(edit);

    return { editId: edit.id, outputMediaId: outputMedia.id };
  } catch (err) {
    edit.status = "failed";
    edit.error = err instanceof Error ? err.message : String(err);
    await editRepo.save(edit);
    return null;
  }
};
