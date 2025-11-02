import { db } from "../../../../lib/db";
import { TagDimension } from "../../entity";

export const getAllTagDimensions = async (): Promise<TagDimension[]> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(TagDimension);

  return repository.find({
    order: { sortOrder: "ASC", name: "ASC" },
    relations: ["tags"],
  });
};

