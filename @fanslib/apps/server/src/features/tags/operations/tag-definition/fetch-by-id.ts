import { t } from "elysia";
import { db } from "../../../../lib/db";
import { TagDefinition, TagDefinitionSchema } from "../../entity";

export const FetchTagDefinitionByIdRequestParamsSchema = t.Object({
  id: t.String(),
});

export const FetchTagDefinitionByIdResponseSchema = TagDefinitionSchema;

export const fetchTagDefinitionById = async (id: number): Promise<typeof FetchTagDefinitionByIdResponseSchema.static | null> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(TagDefinition);

  return repository.findOne({
    where: { id },
    relations: ["dimension"],
  });
};

