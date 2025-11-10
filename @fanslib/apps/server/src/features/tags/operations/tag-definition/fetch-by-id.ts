import { t } from "elysia";
import { db } from "../../../../lib/db";
import { TagDefinition, TagDefinitionSchema } from "../../entity";

export const GetTagDefinitionByIdParamsSchema = t.Object({
  id: t.Number(),
});

export const GetTagDefinitionByIdResponseSchema = TagDefinitionSchema;

export const getTagDefinitionById = async (payload: typeof GetTagDefinitionByIdParamsSchema.static): Promise<typeof GetTagDefinitionByIdResponseSchema.static> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(TagDefinition);

  const tag = await repository.findOne({
    where: { id: payload.id },
    relations: ["dimension"],
  });

  if (!tag) {
    throw new Error(`TagDefinition with id ${payload.id} not found`);
  }

  return tag;
};

