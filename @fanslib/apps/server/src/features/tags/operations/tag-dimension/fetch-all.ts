import { t } from "elysia";
import { db } from "../../../../lib/db";
import { TagDimension, TagDimensionSchema } from "../../entity";

export const GetAllTagDimensionsResponseSchema = t.Array(TagDimensionSchema);

export const getAllTagDimensions = async (): Promise<typeof GetAllTagDimensionsResponseSchema.static> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(TagDimension);

  return repository.find({
    order: { sortOrder: "ASC", name: "ASC" },
    relations: ["tags"],
  });
};

