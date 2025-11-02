import * as fs from "fs/promises";
import { db } from "../../../../lib/db";
import { Media } from "../../entity";
import { getLibraryPath } from "./helpers";

export const deleteMedia = async (id: string, deleteFile = false) => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Media);

  const media = deleteFile ? await repository.findOneBy({ id }) : null;
  await repository.delete({ id });

  if (deleteFile && media) {
    try {
      const libraryPath = getLibraryPath();
      const filePath = `${libraryPath}/${media.relativePath}`;
      await fs.unlink(filePath);
    } catch (error) {
      console.error("Failed to delete file:", error);
    }
  }
};

