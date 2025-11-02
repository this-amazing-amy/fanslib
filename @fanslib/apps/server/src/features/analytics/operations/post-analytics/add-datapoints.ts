import type { FanslyAnalyticsResponse } from "../../../../lib/fansly-analytics/fansly-analytics-response";
import { db } from "../../../../lib/db";
import { aggregatePostAnalyticsData } from "../../../../lib/fansly-analytics/aggregate";
import { saveHashtagsFromAnalytics } from "../../../hashtags/operations/hashtag-stats/save-from-analytics";
import { Post } from "../../../posts/entity";
import { FanslyAnalyticsAggregate, FanslyAnalyticsDatapoint } from "../../entity";
import {
  calculateFypMetrics,
  calculateFypPerformanceScore,
  findPlateauDay,
} from "../../fyp-performance";
import { gatherFanslyPostAnalyticsDatapoints } from "./helpers";

export const addDatapointsToPost = async (
  postId: string,
  response: FanslyAnalyticsResponse
): Promise<FanslyAnalyticsDatapoint[]> => {
  const dataSource = await db();
  const postRepository = dataSource.getRepository(Post);
  const dpRepo = dataSource.getRepository(FanslyAnalyticsDatapoint);
  const aggregateRepo = dataSource.getRepository(FanslyAnalyticsAggregate);

  const post = await postRepository.findOne({
    where: { id: postId },
    relations: { channel: true, postMedia: { media: true } },
  });

  if (!post) {
    throw new Error("Post not found");
  }

  if (post.channel.typeId === "fansly" && response.response.aggregationData?.tags) {
    try {
      await saveHashtagsFromAnalytics(post.channel.id, response);
      console.log(
        `Processed ${response.response.aggregationData.tags.length} hashtags from analytics`
      );
    } catch (error) {
      console.error("Failed to process hashtags from analytics:", error);
    }
  }

  const datapoints = gatherFanslyPostAnalyticsDatapoints(response);

  const savedDatapoints = await Promise.all(
    datapoints.map(async (dp) => {
      const existingDatapointForTimestamp = await dpRepo.findOne({
        where: { timestamp: dp.timestamp, postId },
      });

      if (existingDatapointForTimestamp) {
        const updatedDatapoint = dpRepo.merge(existingDatapointForTimestamp, { post }, dp);
        return dpRepo.save(updatedDatapoint);
      }

      const newDatapoint = dpRepo.create({
        ...dp,
        post,
        postId,
      });
      return dpRepo.save(newDatapoint);
    })
  );

  const postWithDatapoints = await postRepository.findOne({
    where: { id: postId },
    relations: {
      fanslyAnalyticsDatapoints: true,
      postMedia: { media: true },
    },
  });

  if (!postWithDatapoints) {
    throw new Error("Post not found after saving datapoints");
  }

  const aggregatedData = aggregatePostAnalyticsData(postWithDatapoints, false);

  const fypPerformanceScore = await calculateFypPerformanceScore(
    postWithDatapoints,
    savedDatapoints
  );
  const fypMetrics = await calculateFypMetrics(postWithDatapoints, savedDatapoints);
  const plateauDay = findPlateauDay(savedDatapoints);

  const fypPlateauDetectedAt = plateauDay > 0 ? new Date() : undefined;

  const existingAggregate = await aggregateRepo.findOne({
    where: { postId },
  });

  if (existingAggregate) {
    existingAggregate.totalViews = aggregatedData.at(-1)?.Views ?? 0;
    existingAggregate.averageEngagementSeconds =
      aggregatedData.at(-1)?.averageWatchTimeSeconds ?? 0;
    existingAggregate.averageEngagementPercent =
      aggregatedData.at(-1)?.averageWatchTimePercent ?? 0;
    existingAggregate.fypPerformanceScore = fypPerformanceScore;
    existingAggregate.fypMetrics = fypMetrics;
    existingAggregate.fypPlateauDetectedAt = fypPlateauDetectedAt;
    await aggregateRepo.save(existingAggregate);
  } else {
    const newAggregate = aggregateRepo.create({
      post,
      postId,
      totalViews: aggregatedData.at(-1)?.Views ?? 0,
      averageEngagementSeconds: aggregatedData.at(-1)?.averageWatchTimeSeconds ?? 0,
      averageEngagementPercent: aggregatedData.at(-1)?.averageWatchTimePercent ?? 0,
      fypPerformanceScore,
      fypMetrics,
      fypPlateauDetectedAt,
    });
    await aggregateRepo.save(newAggregate);
  }

  return savedDatapoints;
};

