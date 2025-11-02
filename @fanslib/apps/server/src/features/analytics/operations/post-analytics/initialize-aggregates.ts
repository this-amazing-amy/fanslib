import { db } from "../../../../lib/db";
import { aggregatePostAnalyticsData } from "../../../../lib/fansly-analytics/aggregate";
import { Post } from "../../../posts/entity";
import { FanslyAnalyticsAggregate } from "../../entity";
import {
  calculateFypMetrics,
  calculateFypPerformanceScore,
  findPlateauDay,
} from "../../fyp-performance";

export const initializeAnalyticsAggregates = async (): Promise<void> => {
  const dataSource = await db();
  const postRepository = dataSource.getRepository(Post);
  const aggregateRepo = dataSource.getRepository(FanslyAnalyticsAggregate);

  const posts = await postRepository
    .createQueryBuilder("post")
    .leftJoinAndSelect("post.fanslyAnalyticsDatapoints", "datapoints")
    .leftJoinAndSelect("post.fanslyAnalyticsAggregate", "aggregate")
    .leftJoinAndSelect("post.postMedia", "postMedia")
    .leftJoinAndSelect("postMedia.media", "media")
    .where("datapoints.id IS NOT NULL")
    .andWhere("aggregate.id IS NULL")
    .getMany();

  await Promise.all(
    posts.map(async (post) => {
      const aggregated = aggregatePostAnalyticsData(post, false);

      if (!aggregated.at(-1)) {
        return;
      }

      const fypPerformanceScore = await calculateFypPerformanceScore(
        post,
        post.fanslyAnalyticsDatapoints
      );
      const fypMetrics = await calculateFypMetrics(post, post.fanslyAnalyticsDatapoints);
      const plateauDay = findPlateauDay(post.fanslyAnalyticsDatapoints);

      const fypPlateauDetectedAt = plateauDay > 0 ? new Date() : undefined;

      const existingAggregate = await aggregateRepo.findOne({
        where: { postId: post.id },
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
          post,
          postId: post.id,
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

