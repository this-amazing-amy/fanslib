import { t } from "elysia";
import { In } from "typeorm";
import { db } from "../../../../lib/db";
import { MediaTag } from "../../entity";

export const RemoveTagsFromMediaRequestParamsSchema = t.Object({
  mediaId: t.String(),
});

export const RemoveTagsFromMediaRequestBodySchema = t.Object({
  tagIds: t.Array(t.Number()),
});

export const RemoveTagsFromMediaResponseSchema = t.Object({
  success: t.Boolean(),
});

export const removeTagsFromMedia = async (params: typeof RemoveTagsFromMediaRequestParamsSchema.static, payload: typeof RemoveTagsFromMediaRequestBodySchema.static): Promise<typeof RemoveTagsFromMediaResponseSchema.static> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(MediaTag);

  await repository.delete({
    mediaId: params.mediaId,
    tagDefinitionId: In(payload.tagIds),
  });

  return { success: true };
};

