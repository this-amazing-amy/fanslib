import { db } from "../../../../lib/db";
import { MediaTag } from "../../entity";

export const getMediaTags = async (mediaId: string, dimensionId?: number): Promise<MediaTag[]> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(MediaTag);

  const queryBuilder = repository
    .createQueryBuilder("mt")
    .leftJoinAndSelect("mt.media", "media")
    .leftJoinAndSelect("mt.tag", "tag")
    .leftJoinAndSelect("tag.dimension", "dimension")
    .where("mt.mediaId = :mediaId", { mediaId });

  if (dimensionId) {
    queryBuilder.andWhere("tag.dimensionId = :dimensionId", { dimensionId });
  }

  return queryBuilder.getMany();
};

