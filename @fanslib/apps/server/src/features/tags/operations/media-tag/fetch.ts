import { z } from "zod";
import { db } from "../../../../lib/db";
import { MediaTag, MediaTagSchema } from "../../entity";

export const FetchMediaTagsRequestParamsSchema = z.object({
  mediaId: z.string(),
});

export const FetchMediaTagsRequestQuerySchema = z.object({
  dimensionId: z.string().optional(),
});

export const FetchMediaTagsResponseSchema = z.array(MediaTagSchema);

export const fetchMediaTags = async (params: z.infer<typeof FetchMediaTagsRequestParamsSchema>, query: z.infer<typeof FetchMediaTagsRequestQuerySchema>): Promise<z.infer<typeof FetchMediaTagsResponseSchema>> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(MediaTag);

  const queryBuilder = repository
    .createQueryBuilder("mt")
    .leftJoinAndSelect("mt.media", "media")
    .leftJoinAndSelect("mt.tag", "tag")
    .leftJoinAndSelect("tag.dimension", "dimension")
    .where("mt.mediaId = :mediaId", { mediaId: params.mediaId });

  if (query.dimensionId) {
    queryBuilder.andWhere("tag.dimensionId = :dimensionId", { dimensionId: query.dimensionId });
  }

  return queryBuilder.getMany();
};

