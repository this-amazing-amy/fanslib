/* eslint-disable functional/no-loop-statements */
import type { Stats } from "fs";
import { promises as fs } from "fs";
import { db } from "../../../../lib/db";
import { convertRelativeToAbsolute } from "../../../../lib/path-utils";
import { Media } from "../../entity";

/**
 * Try to find a media entry that matches the given file stats
 * This helps identify renamed files by matching size and creation time
 * Only considers it a match if the original file no longer exists at its old location
 */
export const findMediaByStats = async (stats: Stats, libraryPath: string) => {
  // Find all media with matching size and creation date
  const mediaRepo = (await db()).getRepository(Media);
  const potentialMatches = await mediaRepo.find({
    where: {
      size: stats.size,
      fileCreationDate: stats.birthtime,
    },
  });

  // Check each potential match
  for (const media of potentialMatches) {
    try {
      // Check if the original file still exists using path resolution
      try {
        const resolvedPath = convertRelativeToAbsolute(media.relativePath, libraryPath);
        await fs.access(resolvedPath);
        // If we can access the file, it still exists, so this is not our moved file
        continue;
      } catch {
        // File doesn't exist at original location, this is probably our moved file
        return media;
      }
    } catch (error) {
      console.error(`Failed to process potential match ${media.relativePath}:`, error);
    }
  }

  return null;
};
