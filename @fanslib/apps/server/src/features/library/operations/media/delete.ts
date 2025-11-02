import * as fs from "fs/promises";
import { db } from "../../../../lib/db";
import { env } from "../../../../lib/env";
import { Media } from "../../entity";

export const deleteMedia = async (id: string, deleteFile = false) => {
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
    }
  }
};

