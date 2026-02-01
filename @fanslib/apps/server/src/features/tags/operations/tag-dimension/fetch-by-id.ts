import { z } from "zod";
import { db } from "../../../../lib/db";
import { TagDimension, TagDimensionSchema } from "../../entity";

export const FetchTagDimensionByIdRequestParamsSchema = z.object({
  id: z.string(),
});

export const FetchTagDimensionByIdResponseSchema = TagDimensionSchema;

export const fetchTagDimensionById = async (id: number): Promise<z.infer<typeof FetchTagDimensionByIdResponseSchema> | null> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(TagDimension);

  return repository.findOne({
    where: { id },
    relations: ["tags"],
  });
};

