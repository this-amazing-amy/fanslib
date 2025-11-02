import { In } from "typeorm";
import { db } from "../../../../lib/db";
import { MediaTag, TagDefinition, TagDimension } from "../../entity";

export const deleteTagDimension = async (id: number): Promise<void> => {
  const dataSource = await db();

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
};

