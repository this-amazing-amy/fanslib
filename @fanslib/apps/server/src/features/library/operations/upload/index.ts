import { promises as fs } from "fs";
import path from "path";
import { db } from "../../../../lib/db";
import { env } from "../../../../lib/env";
import { getVideoDuration } from "../../../../lib/video";
import { Shoot } from "../../../shoots/entity";
import { createMedia } from "../media/create";
import { generateThumbnail } from "../scan/thumbnail";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".mov", ".avi", ".mkv"]);

const SUPPORTED_EXTENSIONS = new Set([...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS]);

const shootFolderSlug = (shootName: string): string =>
  shootName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

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
        .catch(() => false)
    )
  );

  const firstAvailable = exists.findIndex((e) => !e);
  return `${base}_${firstAvailable + 1}${ext}`;
};

export type UploadMediaInput = {
  shootId: string;
  file: File;
};

export const uploadMediaToShoot = async ({ shootId, file }: UploadMediaInput) => {
  const libraryPath = env().libraryPath;

  const database = await db();
  const shoot = await database.getRepository(Shoot).findOne({ where: { id: shootId } });
  if (!shoot) throw new Error(`Shoot not found: ${shootId}`);

  const ext = path.extname(file.name).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(ext)) {
    throw new Error(`Unsupported file type: ${ext}`);
  }

  const type = mediaTypeFromExtension(ext);
  if (!type) throw new Error(`Cannot determine media type for: ${ext}`);

  const slug = shootFolderSlug(shoot.name);
  const targetDir = path.join(libraryPath, "shoots", slug);
  await fs.mkdir(targetDir, { recursive: true });

  const uniqueFilename = await resolveUniqueFilename(targetDir, file.name);
  const absolutePath = path.join(targetDir, uniqueFilename);

  await Bun.write(absolutePath, file);

  const stats = await fs.stat(absolutePath);

  const duration = type === "video" ? await getVideoDuration(absolutePath) : undefined;

  const relativePath = path.join("shoots", slug, uniqueFilename);

  const media = await createMedia({
    relativePath,
    name: uniqueFilename,
    type,
    size: stats.size,
    duration,
    fileCreationDate: stats.birthtime,
    fileModificationDate: stats.mtime,
  });

  try {
    await generateThumbnail(absolutePath, media.id, type);
  } catch (error) {
    console.error(`Failed to generate thumbnail for ${absolutePath}:`, error);
  }

  await database
    .createQueryBuilder()
    .relation(Shoot, "media")
    .of(shootId)
    .add(media.id);

  return media;
};
