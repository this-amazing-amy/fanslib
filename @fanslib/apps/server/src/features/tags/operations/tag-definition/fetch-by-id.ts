import { z } from "zod";
import { db } from "../../../../lib/db";
import { TagDefinition, TagDefinitionSchema } from "../../entity";

export const FetchTagDefinitionByIdRequestParamsSchema = z.object({
  id: z.string(),
});

export const FetchTagDefinitionByIdResponseSchema = TagDefinitionSchema;

export const fetchTagDefinitionById = async (id: number): Promise<z.infer<typeof FetchTagDefinitionByIdResponseSchema> | null> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(TagDefinition);

  return repository.findOne({
    where: { id },
    relations: ["dimension"],
  });
};

