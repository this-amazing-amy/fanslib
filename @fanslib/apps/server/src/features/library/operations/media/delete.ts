import { t } from "elysia";
import * as fs from "fs/promises";
import { db } from "../../../../lib/db";
import { env } from "../../../../lib/env";
import { Media } from "../../entity";

export const DeleteMediaRequestParamsSchema = t.Object({
  id: t.String(),
});

export const DeleteMediaQuerySchema = t.Object({
  deleteFile: t.Optional(t.String()), // "true" or undefined
});

export const DeleteMediaResponseSchema = t.Object({
  success: t.Boolean(),
  error: t.Optional(t.String()),
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

