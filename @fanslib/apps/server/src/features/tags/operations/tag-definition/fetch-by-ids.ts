import { t } from "elysia";
import { In } from "typeorm";
import { db } from "../../../../lib/db";
import { TagDefinition, TagDefinitionSchema } from "../../entity";

export const GetTagDefinitionsByIdsQuerySchema = t.Object({
  ids: t.Array(t.Number()),
});

export const GetTagDefinitionsByIdsResponseSchema = t.Array(TagDefinitionSchema);

export const getTagDefinitionsByIds = async (
  payload: typeof GetTagDefinitionsByIdsQuerySchema.static
): Promise<typeof GetTagDefinitionsByIdsResponseSchema.static> => {
  if (payload.ids?.length === 0) {
    return [];
  }

  const dataSource = await db();
  const repository = dataSource.getRepository(TagDefinition);

  const numericIds = payload.ids
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

