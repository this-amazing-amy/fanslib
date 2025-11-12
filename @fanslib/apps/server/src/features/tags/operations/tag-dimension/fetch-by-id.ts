import { t } from "elysia";
import { db } from "../../../../lib/db";
import { TagDimension, TagDimensionSchema } from "../../entity";

export const FetchTagDimensionByIdRequestParamsSchema = t.Object({
  id: t.String(),
});

export const FetchTagDimensionByIdResponseSchema = TagDimensionSchema;

export const fetchTagDimensionById = async (id: number): Promise<typeof FetchTagDimensionByIdResponseSchema.static | null> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(TagDimension);

  return repository.findOne({
    where: { id },
    relations: ["tags"],
  });
};

