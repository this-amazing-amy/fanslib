import type { DataSource } from "typeorm";
import { PostMedia } from "../posts/entity";
import { FanslyAnalyticsAggregate, FanslyAnalyticsDatapoint } from "./entity";
import { FANSLY_ANALYTICS_FIXTURES } from "./fixtures-data";

export { FANSLY_ANALYTICS_FIXTURES } from "./fixtures-data";

export const seedFanslyAnalyticsFixtures = async (dataSource: DataSource): Promise<void> => {
  const postMediaRepo = dataSource.getRepository(PostMedia);
  const aggregateRepo = dataSource.getRepository(FanslyAnalyticsAggregate);
  const datapointRepo = dataSource.getRepository(FanslyAnalyticsDatapoint);

  await Promise.all(
    FANSLY_ANALYTICS_FIXTURES.map(async (row) => {
      const postMedia = await postMediaRepo
        .createQueryBuilder("pm")
        .leftJoinAndSelect("pm.post", "post")
        .leftJoinAndSelect("pm.media", "media")
        .where("post.id = :postId", { postId: row.postId })
        .andWhere("media.id = :mediaId", { mediaId: row.mediaId })
        .getOne();

      if (!postMedia) {
        return;
      }

      const existingAgg = await aggregateRepo.findOne({ where: { postMediaId: postMedia.id } });
      if (existingAgg) {
        return;
      }

      const aggRow = aggregateRepo.create({
        postMedia,
        postMediaId: postMedia.id,
        totalViews: row.aggregate.totalViews,
        averageEngagementPercent: row.aggregate.averageEngagementPercent,
        averageEngagementSeconds: row.aggregate.averageEngagementSeconds,
        plateauDetectedAt: row.aggregate.plateauDetectedAt ?? undefined,
        nextFetchAt: row.aggregate.nextFetchAt ?? undefined,
      });
      await aggregateRepo.save(aggRow);

      const datapoints = row.datapoints ?? [];
      if (datapoints.length === 0) {
        return;
      }

      await Promise.all(
        datapoints.map((dp) =>
          datapointRepo.save(
            datapointRepo.create({
              timestamp: dp.timestamp,
              views: dp.views,
              interactionTime: dp.interactionTime,
              postMedia,
              postMediaId: postMedia.id,
            }),
          ),
        ),
      );
    }),
  );
};
