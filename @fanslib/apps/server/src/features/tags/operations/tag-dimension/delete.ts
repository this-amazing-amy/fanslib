import { z } from "zod";
import { In } from "typeorm";
import { db } from "../../../../lib/db";
import { MediaTag, TagDefinition, TagDimension } from "../../entity";

export const DeleteTagDimensionParamsSchema = z.object({
  id: z.string(),
});

export const DeleteTagDimensionResponseSchema = z.object({
  success: z.boolean(),
});

export const deleteTagDimension = async (id: number): Promise<boolean> => {
  const dataSource = await db();
  const dimension = await dataSource.getRepository(TagDimension).findOne({ where: { id } });
  if (!dimension) {
    return false;
  }

  await dataSource.transaction(async (manager) => {
    const tagDefinitions = await manager
      .getRepository(TagDefinition)
      .find({ where: { dimensionId: id } });

    if (tagDefinitions.length > 0) {
      const tagIds = tagDefinitions.map((tag) => tag.id);

      await manager.getRepository(MediaTag).delete({ tagDefinitionId: In(tagIds) });

      await manager.getRepository(TagDefinition).delete({ dimensionId: id });
    }

    await manager.getRepository(TagDimension).delete(id);
  });

  return true;
};

