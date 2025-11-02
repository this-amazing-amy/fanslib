import { db } from "../../../../lib/db";
import { TagDefinition } from "../../entity";

export const getTagsByDimension = async (dimensionId: number): Promise<TagDefinition[]> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(TagDefinition);

  return repository.find({
    where: { dimensionId },
    relations: ["parent", "children"],
    order: { sortOrder: "ASC", displayName: "ASC" },
  });
};

