import { t } from "elysia";
import { db } from "../../../../lib/db";
import { MediaTag, TagDefinition } from "../../entity";

export const DeleteTagDefinitionParamsSchema = t.Object({
  id: t.String(),
});

export const DeleteTagDefinitionResponseSchema = t.Object({
  success: t.Boolean(),
});

export const deleteTagDefinition = async (id: number): Promise<boolean> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(TagDefinition);
  const mediaTagRepository = dataSource.getRepository(MediaTag);
  const tag = await repository.findOne({ where: { id } });
  if (!tag) {
    return false;
  }
  const associatedMediaTags = await mediaTagRepository.find({
    where: { tagDefinitionId: id },
  });

  if (associatedMediaTags.length > 0) {
    await mediaTagRepository.remove(associatedMediaTags);
  }

  await repository.delete(id);
  return true;
};

