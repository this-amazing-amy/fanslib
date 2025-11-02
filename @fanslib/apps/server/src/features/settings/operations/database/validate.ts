import type { ValidationResult } from "@fanslib/types";
import { access } from "fs/promises";
import { db } from "../../../../lib/db";
import { Media } from "../../../library/entity";
import { convertRelativeToAbsolute } from "../../../library/path-utils";

export const validateImportedDatabase = async (
): Promise<ValidationResult> => {
  try {
    const database = await db();
    const mediaRepository = database.getRepository(Media);
    const allMedia = await mediaRepository.find();

    // eslint-disable-next-line functional/no-let
    let validFiles = 0;
    const missingFiles: string[] = [];

    await Promise.all(
      allMedia.map(async (media) => {
        try {
          const absolutePath = convertRelativeToAbsolute(media.relativePath);
          await access(absolutePath);
          validFiles++;
        } catch {
          missingFiles.push(media.relativePath);
        }
      })
    );

    return {
      totalFiles: allMedia.length,
      missingFiles,
      validFiles,
    };
  } catch (error) {
    console.error("Error validating imported database:", error);
    return {
      totalFiles: 0,
      missingFiles: [],
      validFiles: 0,
    };
  }
};

