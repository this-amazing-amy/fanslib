import { format } from "date-fns";
import { promises as fs } from "fs";
import path from "path";
import { db } from "../../../../lib/db";
import { env } from "../../../../lib/env";
import { getVideoDimensions, getVideoDuration } from "../../../../lib/video";
import { Shoot } from "../../../shoots/entity";
import { createMedia } from "../media/create";
import { generateThumbnail } from "../scan/thumbnail";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".mov", ".avi", ".mkv"]);
const SUPPORTED_EXTENSIONS = new Set([...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS]);

const shootFolderName = (shoot: Shoot): string => {
  const date = format(shoot.shootDate, "yyyy-MM-dd");
  const slug = shoot.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${date}_${slug}`;
};

const mediaTypeFromExtension = (ext: string): "image" | "video" | null => {
  if (IMAGE_EXTENSIONS.has(ext)) return "image";
  if (VIDEO_EXTENSIONS.has(ext)) return "video";
  return null;
};

const resolveUniqueFilename = async (dir: string, filename: string): Promise<string> => {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);

  const candidate = path.join(dir, filename);
  try {
    await fs.access(candidate);
  } catch {
    return filename;
  }

  const exists = await Promise.all(
    Array.from({ length: 99 }, (_, i) =>
      fs
        .access(path.join(dir, `${base}_${i + 1}${ext}`))
        .then(() => true)
        .catch(() => false),
    ),
  );

  const firstAvailable = exists.findIndex((e) => !e);
  return `${base}_${firstAvailable + 1}${ext}`;
};

export type FinalizeUploadedMediaInput = {
  stagedAbsolutePath: string;
  originalName: string;
  shootId: string;
  category?: "library" | "footage";
  note?: string;
};

export const finalizeUploadedMedia = async ({
  stagedAbsolutePath,
  originalName,
  shootId,
  category = "library",
  note,
}: FinalizeUploadedMediaInput) => {
  const mediaPath = env().mediaPath;

  const database = await db();
  const shoot = await database.getRepository(Shoot).findOne({ where: { id: shootId } });
  if (!shoot) throw new Error(`Shoot not found: ${shootId}`);

  const ext = path.extname(originalName).toLowerCase();
  const type = mediaTypeFromExtension(ext);
  if (!type || !SUPPORTED_EXTENSIONS.has(ext)) {
    throw new Error(`Unsupported file type: ${ext}`);
  }

  const folderName = shootFolderName(shoot);
  const baseDir = category === "footage" ? "footage" : "shoots";
  const targetDir = path.join(mediaPath, baseDir, folderName);
  await fs.mkdir(targetDir, { recursive: true });

  const uniqueFilename = await resolveUniqueFilename(targetDir, originalName);
  const absolutePath = path.join(targetDir, uniqueFilename);
  await fs.rename(stagedAbsolutePath, absolutePath);

  const stats = await fs.stat(absolutePath);

  const duration = type === "video" ? await getVideoDuration(absolutePath) : undefined;
  const dimensions = await getVideoDimensions(absolutePath);

  const relativePath = path.join(baseDir, folderName, uniqueFilename);

  const media = await createMedia({
    relativePath,
    name: uniqueFilename,
    type,
    size: stats.size,
    duration,
    width: dimensions?.width,
    height: dimensions?.height,
    fileCreationDate: stats.birthtime,
    fileModificationDate: stats.mtime,
    category,
    note,
  });

  try {
    await generateThumbnail(absolutePath, media.id, type);
  } catch (error) {
    console.error(`Failed to generate thumbnail for ${absolutePath}:`, error);
  }

  await database.createQueryBuilder().relation(Shoot, "media").of(shootId).add(media.id);

  return media;
};
