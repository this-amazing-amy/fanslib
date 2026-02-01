import { z } from "zod";
import { In } from "typeorm";
import { db } from "../../../../lib/db";
import { TagDefinition, TagDefinitionSchema } from "../../entity";

export const FetchTagDefinitionsByIdsRequestQuerySchema = z.object({
  ids: z.array(z.number()),
});

export const FetchTagDefinitionsByIdsResponseSchema = z.array(TagDefinitionSchema);

export const fetchTagDefinitionsByIds = async (
  payload: z.infer<typeof FetchTagDefinitionsByIdsRequestQuerySchema>
): Promise<z.infer<typeof FetchTagDefinitionsByIdsResponseSchema>> => {
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

