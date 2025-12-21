/* eslint-disable functional/no-let */
/* eslint-disable functional/no-loop-statements */
/* eslint-disable functional/no-this-expressions */
import { isSameSecond } from "date-fns";
import { t } from "elysia";
import { promises as fs } from "fs";
import path from "path";
import { db } from "../../../../lib/db";
import { env } from "../../../../lib/env";
import { convertRelativeToAbsolute } from "../../../../lib/path-utils";
import { getVideoDuration } from "../../../../lib/video";
import { walkDirectory } from "../../../../lib/walkDirectory";
import { Media } from "../../entity";
import { MediaSchema } from "../../schema";
import { createMedia } from "../media/create";
import { deleteMedia } from "../media/delete";
import { fetchMediaByPath } from "../media/fetch-by-path";
import { updateMedia } from "../media/update";
import { findMediaByStats } from "./find-by-stats";
import { generateThumbnail, thumbnailExists } from "./thumbnail";
import { repairUppercaseExtension } from "./uppercase-extensions";

export const ScanFileRequestBodySchema = t.Object({
  filePath: t.String(),
});

export const ScanLibraryResponseSchema = t.Object({
  message: t.String(),
  started: t.Boolean(),
});

export const FileScanResultSchema = t.Object({
  action: t.Union([t.Literal('added'), t.Literal('updated'), t.Literal('unchanged')]),
  media: MediaSchema,
});

export const LibraryScanResultSchema = t.Object({
  added: t.Number(),
  updated: t.Number(),
  removed: t.Number(),
  total: t.Number(),
});

export const LibraryScanProgressSchema = t.Object({
  current: t.Number(),
  total: t.Number(),
});

export const ScanStatusResponseSchema = t.Union([
  t.Object({
    isScanning: t.Literal(true),
    progress: t.Union([LibraryScanProgressSchema, t.Null()]),
  }),
  t.Object({
    isScanning: t.Literal(false),
    result: t.Union([LibraryScanResultSchema, t.Null()]),
  }),
  t.Null(),
]);

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".mov", ".avi", ".mkv"]);

// Module-level state for scan progress and results
let currentScanProgress: typeof LibraryScanProgressSchema.static | null = null;
let currentScanResult: typeof LibraryScanResultSchema.static | null = null;

const convertToRelativePath = (absolutePath: string, libraryPath: string): string => {
  if (!path.isAbsolute(absolutePath)) {
    return absolutePath;
  }
  return path.relative(libraryPath, absolutePath);
};

const isMediaFile = (
  filePath: string
): { isSupported: boolean; type: "image" | "video" | null } => {
  const ext = path.extname(filePath).toLowerCase();
  if (IMAGE_EXTENSIONS.has(ext)) {
    return { isSupported: true, type: "image" };
  }
  if (VIDEO_EXTENSIONS.has(ext)) {
    return { isSupported: true, type: "video" };
  }
  return { isSupported: false, type: null };
};

export const scanFile = async (filePath: string): Promise<typeof FileScanResultSchema.static> => {
  const { isSupported, type } = isMediaFile(filePath);

  if (!isSupported || !type) {
    throw new Error(`Unsupported file type: ${filePath}`);
  }

  const libraryPath = env().libraryPath;
  const relativePath = convertToRelativePath(filePath, libraryPath);
  const stats = await fs.stat(filePath);
  const existingMedia = (await fetchMediaByPath(relativePath)) ?? (await findMediaByStats(stats, libraryPath));

  if (!existingMedia) {
    const media = {
      relativePath,
      type,
      name: path.basename(filePath),
      size: stats.size,
      fileCreationDate: stats.birthtime,
      fileModificationDate: stats.mtime,
      duration: type === "video" ? await getVideoDuration(filePath) : undefined,
    };

    const newMedia = await createMedia(media);

    try {
      await generateThumbnail(filePath, newMedia.id, type);
    } catch (error) {
      console.error(`Failed to generate thumbnail for ${filePath}:`, error);
    }
    return { action: "added", media: newMedia };
  }

  const hasThumbnail = await thumbnailExists(existingMedia.id);

  const needsUpdate =
    existingMedia.relativePath !== relativePath ||
    !isSameSecond(stats.mtime, existingMedia.fileModificationDate) ||
    existingMedia.size !== stats.size ||
    !hasThumbnail;

  if (!needsUpdate) {
    return { action: "unchanged", media: existingMedia };
  }

  const updatedMedia = await updateMedia(existingMedia.id, {
    ...existingMedia,
    relativePath,
    name: path.basename(filePath),
    fileModificationDate: stats.mtime,
    size: stats.size,
    duration: type === "video" ? await getVideoDuration(filePath) : undefined,
  });

  if (!updatedMedia) {
    throw new Error(`Failed to update media ${existingMedia.id}`);
  }

  try {
    await generateThumbnail(filePath, updatedMedia.id, type);
  } catch (error) {
    console.error(`Failed to generate thumbnail for ${filePath}:`, error);
  }

  return { action: "updated", media: updatedMedia };
};

// eslint-disable-next-line functional/no-classes
class LibraryScanner {
  private static instance: LibraryScanner;
  private isScanning: boolean = false;

  public static getInstance(): LibraryScanner {
    if (!LibraryScanner.instance) {
      LibraryScanner.instance = new LibraryScanner();
    }
    return LibraryScanner.instance;
  }

  public isCurrentlyScanning(): boolean {
    return this.isScanning;
  }

  public onProgress(progress: typeof LibraryScanProgressSchema.static): void {
    // Store progress in module-level state instead of sending IPC events
    currentScanProgress = progress;
  }

  public onComplete(result: typeof LibraryScanResultSchema.static): void {
    // Store result in module-level state instead of sending IPC events
    currentScanResult = result;
    // Delay clearing progress slightly to ensure it's visible for status checks
    setTimeout(() => {
      currentScanProgress = null;
    }, 100);
  }

  public async startScan(): Promise<void> {
    if (this.isScanning) {
      throw new Error("Scan already in progress");
    }

    this.isScanning = true;
    currentScanProgress = null;
    currentScanResult = null;

    try {
      // First pass: collect all files
      const filesToProcess: string[] = [];
      const libraryPath = env().libraryPath;

      console.log("Library scan starting", {
        libraryPath,
      });

       
      for await (const filePath of walkDirectory(libraryPath)) {
        const { isSupported } = isMediaFile(filePath);
        if (isSupported) {
          filesToProcess.push(filePath);
        }
      }

      console.log("Library scan files discovered", {
        libraryPath,
        totalFiles: filesToProcess.length,
        files: filesToProcess,
      });

      // Get existing media for cleanup
      const database = await db();
      const existingMedia = await database.getRepository(Media).find();
      const processedPaths = new Set<string>();
      const processedMediaIds = new Set<string>(); // Track which media entries we've processed

      const result: typeof LibraryScanResultSchema.static = {
        added: 0,
        updated: 0,
        removed: 0,
        total: 0,
      };

      // Second pass: process files
      for (let i = 0; i < filesToProcess.length; i++) {
        const filePathRaw = filesToProcess[i];
        if (!filePathRaw) continue;
        const filePath = await repairUppercaseExtension(filePathRaw);
        processedPaths.add(filePath);

        try {
          const scanResult = await scanFile(filePath);
          switch (scanResult.action) {
            case "added":
              result.added++;
              processedMediaIds.add(scanResult.media.id);
              break;
            case "updated":
              result.updated++;
              processedMediaIds.add(scanResult.media.id);
              break;
            case "unchanged":
              processedMediaIds.add(scanResult.media.id);
              break;
          }
        } catch (error) {
          console.error(`Failed to scan file ${filePath}:`, error);
        }

        // Emit progress
        this.onProgress({
          current: i + 1,
          total: filesToProcess.length,
        });
      }

      // Cleanup: remove files that no longer exist and weren't processed
      for (const media of existingMedia) {
        // Skip if we've already processed this media (it was moved)
        if (processedMediaIds.has(media.id)) {
          continue;
        }

        // Skip if media doesn't have relativePath set (needs migration)
        if (!media.relativePath) {
          continue;
        }

        // Check if the file still exists using path resolution
        try {
          const resolvedPath = convertRelativeToAbsolute(media.relativePath, libraryPath);
          await fs.access(resolvedPath);
          // File exists, keep it
          continue;
        } catch {
          // File doesn't exist and wasn't processed (moved) - delete it
          await deleteMedia(media.id);
          result.removed++;
        }
      }

      result.total = existingMedia.length - result.removed + result.added;
      this.onComplete(result);
    } finally {
      this.isScanning = false;
    }
  }
}

export const scanLibrary = async (): Promise<typeof LibraryScanResultSchema.static> => {
  const scanner = LibraryScanner.getInstance();

  scanner.startScan().catch((error) => {
    console.error("Library scan failed:", error);
  });

  return {
    added: 0,
    updated: 0,
    removed: 0,
    total: 0,
  };
};

export const getScanStatus = (): typeof ScanStatusResponseSchema.static => {
  const scanner = LibraryScanner.getInstance();
  const isScanning = scanner.isCurrentlyScanning();

  return isScanning
    ? { isScanning: true, progress: currentScanProgress }
    : { isScanning: false, result: currentScanResult };
};

export { LibraryScanner };
