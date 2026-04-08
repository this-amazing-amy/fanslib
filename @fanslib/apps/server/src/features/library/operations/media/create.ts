import { db } from "../../../../lib/db";
import { Media } from "../../entity";

export const createMedia = async ({
  relativePath,
  name,
  type,
  size,
  duration,
  fileCreationDate,
  fileModificationDate,
  category,
  note,
}: {
  relativePath: string;
  name: string;
  type: "image" | "video";
  size: number;
  duration?: number;
  fileCreationDate: Date;
  fileModificationDate: Date;
  category?: "library" | "footage";
  note?: string;
}) => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Media);

  const media = repository.create({
    relativePath,
    name,
    type,
    size,
    duration,
    fileCreationDate,
    fileModificationDate,
    ...(category ? { category } : {}),
    ...(note ? { note } : {}),
  });

  return repository.save(media);
};
