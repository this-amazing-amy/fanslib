import { db } from "../../../../lib/db";
import { TagDimension } from "../../entity";

export const getTagDimensionById = async (id: number): Promise<TagDimension> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(TagDimension);

  const dimension = await repository.findOne({
    where: { id },
    relations: ["tags"],
  });

  if (!dimension) {
    throw new Error(`TagDimension with id ${id} not found`);
  }

  return dimension;
};

