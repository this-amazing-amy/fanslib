import { z } from "zod";
import { db } from "../../../../lib/db";
import { MediaTag, MediaTagSchema } from "../../entity";

export const FetchBulkMediaTagsRequestBodySchema = z.object({
  mediaIds: z.array(z.string()),
});

export const FetchBulkMediaTagsResponseSchema = z.record(z.string(), z.array(MediaTagSchema));

export const fetchBulkMediaTags = async (
  mediaIds: string[]
): Promise<z.infer<typeof FetchBulkMediaTagsResponseSchema>> => {
  if (mediaIds.length === 0) return {};

  const dataSource = await db();
  const repository = dataSource.getRepository(MediaTag);

  const tags = await repository
    .createQueryBuilder("mt")
    .where("mt.mediaId IN (:...mediaIds)", { mediaIds })
    .getMany();

  return tags.reduce<Record<string, z.infer<typeof MediaTagSchema>[]>>((acc, tag) => {
    const existing = acc[tag.mediaId] ?? [];
    return { ...acc, [tag.mediaId]: [...existing, tag] };
  }, {});
};
