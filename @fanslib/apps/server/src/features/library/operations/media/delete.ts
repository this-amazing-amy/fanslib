import { z } from "zod";
import * as fs from "fs/promises";
import { db } from "../../../../lib/db";
import { env } from "../../../../lib/env";
import { Media } from "../../entity";

export const DeleteMediaRequestParamsSchema = z.object({
  id: z.string(),
});

export const DeleteMediaQuerySchema = z.object({
  deleteFile: z.string().optional(), // "true" or undefined
});

export const DeleteMediaResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});

export const deleteMedia = async (id: string, deleteFile = false): Promise<boolean> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Media);
  const media = await repository.findOne({ where: { id } });
  if (!media) {
    return false;
  }
  await repository.delete({ id });

  if (deleteFile) {
    try {
      const libraryPath = env().libraryPath;
      const filePath = `${libraryPath}/${media.relativePath}`;
      await fs.unlink(filePath);
    } catch (error) {
      console.error("Failed to delete file:", error);
      return false;
    }
  }

  return true;
};

