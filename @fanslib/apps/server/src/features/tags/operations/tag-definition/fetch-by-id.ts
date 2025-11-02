import { db } from "../../../../lib/db";
import { TagDefinition } from "../../entity";

export const getTagDefinitionById = async (id: number): Promise<TagDefinition> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(TagDefinition);

  const tag = await repository.findOne({
    where: { id },
    relations: ["dimension"],
  });

  if (!tag) {
    throw new Error(`TagDefinition with id ${id} not found`);
  }

  return tag;
};

