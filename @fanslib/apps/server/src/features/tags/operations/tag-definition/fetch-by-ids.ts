import { In } from "typeorm";
import { db } from "../../../../lib/db";
import { TagDefinition } from "../../entity";

export const getTagDefinitionsByIds = async (
  tagIds: (string | number)[]
): Promise<TagDefinition[]> => {
  if (tagIds?.length === 0) {
    return [];
  }

  const dataSource = await db();
  const repository = dataSource.getRepository(TagDefinition);

  const numericIds = tagIds
    .map((id) => (typeof id === "string" ? parseInt(id, 10) : id))
    .filter((id) => !isNaN(id) && id > 0);

  if (numericIds.length === 0) {
    return [];
  }

  const tags = await repository.find({
    where: { id: In(numericIds) },
    relations: ["dimension"],
  });

  return tags;
};

