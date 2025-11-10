import { t } from "elysia";
import { db } from "../../../../lib/db";
import { MediaTag, MediaTagSchema } from "../../entity";

export const GetMediaTagsParamsSchema = t.Object({
  mediaId: t.String(),
});

export const GetMediaTagsQuerySchema = t.Object({
  dimensionId: t.Optional(t.String()),
});

export const GetMediaTagsResponseSchema = t.Array(MediaTagSchema);

export const getMediaTags = async (params: typeof GetMediaTagsParamsSchema.static, query: typeof GetMediaTagsQuerySchema.static): Promise<typeof GetMediaTagsResponseSchema.static> => {
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

