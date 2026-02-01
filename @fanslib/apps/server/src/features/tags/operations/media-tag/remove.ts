import { z } from "zod";
import { In } from "typeorm";
import { db } from "../../../../lib/db";
import { MediaTag } from "../../entity";
import { fetchAllTagDefinitionsForHierarchy, getDescendantTagIds } from "../helpers";

export const RemoveTagsFromMediaRequestParamsSchema = z.object({
  mediaId: z.string(),
});

export const RemoveTagsFromMediaRequestBodySchema = z.object({
  tagIds: z.array(z.number()),
});

export const RemoveTagsFromMediaResponseSchema = z.object({
  success: z.boolean(),
});

export const removeTagsFromMedia = async (params: z.infer<typeof RemoveTagsFromMediaRequestParamsSchema>, payload: z.infer<typeof RemoveTagsFromMediaRequestBodySchema>): Promise<z.infer<typeof RemoveTagsFromMediaResponseSchema>> => {
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

