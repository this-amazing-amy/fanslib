import { db } from "../../../../lib/db";
import { aggregatePostMediaAnalyticsData } from "../../../../lib/fansly-analytics/aggregate";
import { PostMedia } from "../../../posts/entity";
import { FanslyAnalyticsAggregate } from "../../entity";
import {
  calculateFypMetrics,
  calculateFypPerformanceScore,
  findPlateauDay,
} from "../../fyp-performance";

export const initializeAnalyticsAggregates = async (): Promise<void> => {
  const dataSource = await db();
  const postMediaRepository = dataSource.getRepository(PostMedia);
  const aggregateRepo = dataSource.getRepository(FanslyAnalyticsAggregate);

  const postMediaList = await postMediaRepository
    .createQueryBuilder("postMedia")
    .leftJoinAndSelect("postMedia.post", "post")
    .leftJoinAndSelect("postMedia.fanslyAnalyticsDatapoints", "datapoints")
    .leftJoinAndSelect("postMedia.fanslyAnalyticsAggregate", "aggregate")
    .leftJoinAndSelect("postMedia.media", "media")
    .where("datapoints.id IS NOT NULL")
    .andWhere("aggregate.id IS NULL")
    .getMany();

  await Promise.all(
    postMediaList.map(async (postMedia) => {
      const aggregated = aggregatePostMediaAnalyticsData(postMedia, false);

      if (!aggregated.at(-1)) {
        return;
      }

      const fypPerformanceScore = await calculateFypPerformanceScore(
        postMedia,
        postMedia.fanslyAnalyticsDatapoints
      );
      const fypMetrics = await calculateFypMetrics(postMedia, postMedia.fanslyAnalyticsDatapoints);
      const plateauDay = findPlateauDay(postMedia.fanslyAnalyticsDatapoints);

      const fypPlateauDetectedAt = plateauDay > 0 ? new Date() : undefined;

      const existingAggregate = await aggregateRepo.findOne({
        where: { postMediaId: postMedia.id },
      });

      if (existingAggregate) {
        existingAggregate.totalViews = aggregated.at(-1)?.Views ?? 0;
        existingAggregate.averageEngagementSeconds =
          aggregated.at(-1)?.averageWatchTimeSeconds ?? 0;
        existingAggregate.averageEngagementPercent =
          aggregated.at(-1)?.averageWatchTimePercent ?? 0;
        existingAggregate.fypPerformanceScore = fypPerformanceScore;
        existingAggregate.fypMetrics = fypMetrics;
        existingAggregate.fypPlateauDetectedAt = fypPlateauDetectedAt;
        await aggregateRepo.save(existingAggregate);
      } else {
        const newAggregate = aggregateRepo.create({
          postMedia,
          postMediaId: postMedia.id,
          totalViews: aggregated.at(-1)?.Views ?? 0,
          averageEngagementSeconds: aggregated.at(-1)?.averageWatchTimeSeconds ?? 0,
          averageEngagementPercent: aggregated.at(-1)?.averageWatchTimePercent ?? 0,
          fypPerformanceScore,
          fypMetrics,
          fypPlateauDetectedAt,
        });

        await aggregateRepo.save(newAggregate);
      }
    })
  );
};

