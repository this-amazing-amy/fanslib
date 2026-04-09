import { db } from "../../../../lib/db";
import { Media } from "../../entity";

export const createMedia = async ({
  relativePath,
  name,
  type,
  size,
  duration,
  width,
  height,
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
  width?: number;
  height?: number;
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
    width: width ?? null,
    height: height ?? null,
    fileCreationDate,
    fileModificationDate,
    ...(category ? { category } : {}),
    ...(note ? { note } : {}),
  });

  return repository.save(media);
};
