import { t } from "elysia";
import { db } from "../../../../lib/db";
import { TagDefinition, TagDefinitionSchema } from "../../entity";

export const FetchTagsByDimensionQuerySchema = t.Object({
  dimensionId: t.Optional(t.Number()),
});

export const FetchTagsByDimensionResponseSchema = t.Array(TagDefinitionSchema);

export const fetchTagsByDimension = async (payload: typeof FetchTagsByDimensionQuerySchema.static): Promise<typeof FetchTagsByDimensionResponseSchema.static> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(TagDefinition);

  if (!payload.dimensionId) {
    return [];
  }

  return repository.find({
    where: { dimensionId: payload.dimensionId },
    relations: ["parent", "children"],
    order: { sortOrder: "ASC", displayName: "ASC" },
  });
};

