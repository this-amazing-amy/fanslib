import type { DataSource } from "typeorm";
import { Channel } from "../channels/entity";
import { Media } from "../library/entity";
import { Post, PostMedia } from "../posts/entity";
import { FanslyAnalyticsAggregate, FanslyAnalyticsDatapoint } from "./entity";
import {
  DEMO_MEDIA_FIXTURES,
  DEMO_POST_FIXTURES,
  DEMO_POST_MEDIA_FIXTURES,
  FANSLY_ANALYTICS_FIXTURES,
} from "./fixtures-data";

export { FANSLY_ANALYTICS_FIXTURES } from "./fixtures-data";

const seedDemoEntities = async (dataSource: DataSource): Promise<void> => {
  const mediaRepo = dataSource.getRepository(Media);
  const postRepo = dataSource.getRepository(Post);
  const postMediaRepo = dataSource.getRepository(PostMedia);
  const channelRepo = dataSource.getRepository(Channel);
  const now = new Date();

  await Promise.all(
    DEMO_MEDIA_FIXTURES.map(async (fixture) => {
      const existing = await mediaRepo.findOne({ where: { id: fixture.id } });
      if (existing) return;
      await mediaRepo.save(
        mediaRepo.create({
          ...fixture,
          fileCreationDate: now,
          fileModificationDate: now,
        }),
      );
    }),
  );

  // eslint-disable-next-line functional/no-loop-statements
  for (const fixture of DEMO_POST_FIXTURES) {
    const existing = await postRepo.findOne({ where: { id: fixture.id } });
    if (existing) continue;

    const channel = await channelRepo.findOne({ where: { id: fixture.channelId } });
    if (!channel) continue;

    await postRepo.save(
      postRepo.create({
        id: fixture.id,
        channelId: fixture.channelId,
        channel,
        caption: fixture.caption,
        status: fixture.status,
        date: fixture.date,
        subredditId: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      }),
    );
  }

  // eslint-disable-next-line functional/no-loop-statements
  for (const fixture of DEMO_POST_MEDIA_FIXTURES) {
    const post = await postRepo.findOne({ where: { id: fixture.postId } });
    const media = await mediaRepo.findOne({ where: { id: fixture.mediaId } });
    if (!post || !media) continue;

    const existing = await postMediaRepo.findOne({
      where: { post: { id: post.id }, media: { id: media.id } },
    });
    if (existing) continue;

    await postMediaRepo.save(
      postMediaRepo.create({
        post,
        media,
        order: fixture.order,
        isFreePreview: fixture.isFreePreview,
        fanslyStatisticsId: fixture.fanslyStatisticsId ?? null,
      }),
    );
  }
};

const seedAnalyticsAggregates = async (dataSource: DataSource): Promise<void> => {
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

      if (!postMedia) return;

      const existingAgg = await aggregateRepo.findOne({ where: { postMediaId: postMedia.id } });
      if (!existingAgg) {
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
      }

      const datapoints = row.datapoints ?? [];
      if (datapoints.length === 0) return;

      const existingDpCount = await datapointRepo.count({ where: { postMediaId: postMedia.id } });
      if (existingDpCount > 0) return;

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

export const seedFanslyAnalyticsFixtures = async (dataSource: DataSource): Promise<void> => {
  await seedDemoEntities(dataSource);
  await seedAnalyticsAggregates(dataSource);
};
