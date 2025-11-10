import { t } from "elysia";
import { In } from "typeorm";
import { db } from "../../../../lib/db";
import { MediaTag, TagDefinition, TagDimension } from "../../entity";

export const DeleteTagDimensionParamsSchema = t.Object({
  id: t.Number(),
});

export const DeleteTagDimensionResponseSchema = t.Object({
  success: t.Boolean(),
});

export const deleteTagDimension = async (payload: typeof DeleteTagDimensionParamsSchema.static): Promise<typeof DeleteTagDimensionResponseSchema.static> => {
  const dataSource = await db();

  return dataSource.transaction(async (manager) => {
    const tagDefinitions = await manager
      .getRepository(TagDefinition)
      .find({ where: { dimensionId: payload.id } });

    if (tagDefinitions.length > 0) {
      const tagIds = tagDefinitions.map((tag) => tag.id);

      await manager.getRepository(MediaTag).delete({ tagDefinitionId: In(tagIds) });

      await manager.getRepository(TagDefinition).delete({ dimensionId: payload.id });
    }

    await manager.getRepository(TagDimension).delete(payload.id);

    return { success: true };
  });
};

