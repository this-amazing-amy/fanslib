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

export const deleteMedia = async (id: string, deleteFile = false): Promise<typeof DeleteMediaResponseSchema.static> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Media);

  const media = deleteFile ? await repository.findOneBy({ id }) : null;
  await repository.delete({ id });

  if (deleteFile && media) {
    try {
      const libraryPath = env().libraryPath;
      const filePath = `${libraryPath}/${media.relativePath}`;
      await fs.unlink(filePath);
    } catch (error) {
      console.error("Failed to delete file:", error);
      return { success: false, error: "Failed to delete file" };
    }
  }

  return { success: true };
};

