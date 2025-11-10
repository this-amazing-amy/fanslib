import { t } from "elysia";
import { db } from "../../../../lib/db";
import { TagDimension, TagDimensionSchema } from "../../entity";

export const GetTagDimensionByIdParamsSchema = t.Object({
  id: t.Number(),
});

export const GetTagDimensionByIdResponseSchema = TagDimensionSchema;

export const getTagDimensionById = async (payload: typeof GetTagDimensionByIdParamsSchema.static): Promise<typeof GetTagDimensionByIdResponseSchema.static> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(TagDimension);

  const dimension = await repository.findOne({
    where: { id: payload.id },
    relations: ["tags"],
  });

  if (!dimension) {
    throw new Error(`TagDimension with id ${payload.id} not found`);
  }

  return dimension;
};

