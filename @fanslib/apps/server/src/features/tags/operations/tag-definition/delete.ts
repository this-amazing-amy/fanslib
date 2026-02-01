import { z } from "zod";
import { db } from "../../../../lib/db";
import { MediaTag, TagDefinition } from "../../entity";

export const DeleteTagDefinitionParamsSchema = z.object({
  id: z.string(),
});

export const DeleteTagDefinitionResponseSchema = z.object({
  success: z.boolean(),
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

