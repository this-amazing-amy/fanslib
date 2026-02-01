import { z } from "zod";
import { db } from "../../../../lib/db";
import { TagDimension, TagDimensionSchema } from "../../entity";

export const GetAllTagDimensionsResponseSchema = z.array(TagDimensionSchema);

export const fetchAllTagDimensions = async (): Promise<z.infer<typeof GetAllTagDimensionsResponseSchema>> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(TagDimension);

  return repository.find({
    order: { sortOrder: "ASC", name: "ASC" },
    relations: ["tags"],
  });
};

