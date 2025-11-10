import { t } from "elysia";
import { db } from "../../../../lib/db";
import { MediaTag, TagDefinition } from "../../entity";

export const DeleteTagDefinitionParamsSchema = t.Object({
  id: t.Number(),
});

export const DeleteTagDefinitionResponseSchema = t.Object({
  success: t.Boolean(),
});

export const deleteTagDefinition = async (payload: typeof DeleteTagDefinitionParamsSchema.static): Promise<typeof DeleteTagDefinitionResponseSchema.static> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(TagDefinition);
  const mediaTagRepository = dataSource.getRepository(MediaTag);

  const associatedMediaTags = await mediaTagRepository.find({
    where: { tagDefinitionId: payload.id },
  });

  if (associatedMediaTags.length > 0) {
    await mediaTagRepository.remove(associatedMediaTags);
    console.log(
      `🧹 Removed ${associatedMediaTags.length} MediaTag entries associated with TagDefinition ${payload.id}`
    );
  }

  await repository.delete(payload.id);

  return { success: true };
};

