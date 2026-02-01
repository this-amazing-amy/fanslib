import { z } from "zod";
import { db } from "../../../../lib/db";
import { TagDefinition, TagDefinitionSchema } from "../../entity";

export const FetchTagsByDimensionQuerySchema = z.object({
  dimensionId: z.number().optional(),
  dimensionName: z.string().optional(),
});

export const FetchTagsByDimensionResponseSchema = z.array(TagDefinitionSchema);

export const fetchTagsByDimension = async (payload: z.infer<typeof FetchTagsByDimensionQuerySchema>): Promise<z.infer<typeof FetchTagsByDimensionResponseSchema>> => {
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

