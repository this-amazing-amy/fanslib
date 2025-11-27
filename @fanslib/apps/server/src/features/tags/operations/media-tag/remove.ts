import { t } from "elysia";
import { In } from "typeorm";
import { db } from "../../../../lib/db";
import { MediaTag } from "../../entity";
import { fetchAllTagDefinitionsForHierarchy, getDescendantTagIds } from "../helpers";

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
  if (payload.tagIds.length === 0) {
    return { success: true };
  }

  const dataSource = await db();
  const repository = dataSource.getRepository(MediaTag);

  const tagDefinitions = await fetchAllTagDefinitionsForHierarchy();
  const descendantTagIds = getDescendantTagIds(payload.tagIds, tagDefinitions);
  const allTagIdsToRemove = [...payload.tagIds, ...descendantTagIds];

  await repository.delete({
    mediaId: params.mediaId,
    tagDefinitionId: In(allTagIdsToRemove),
  });

  return { success: true };
};

