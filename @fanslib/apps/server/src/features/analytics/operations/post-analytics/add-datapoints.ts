import type { FanslyAnalyticsResponse } from "../../../../lib/fansly-analytics/fansly-analytics-response";
import { db } from "../../../../lib/db";
import { aggregatePostMediaAnalyticsData } from "../../../../lib/fansly-analytics/aggregate";
import { saveHashtagsFromAnalytics } from "../../../hashtags/operations/hashtag-stats/save-from-analytics";
import { PostMedia } from "../../../posts/entity";
import { FanslyAnalyticsAggregate, FanslyAnalyticsDatapoint } from "../../entity";
import {
  calculateFypMetrics,
  calculateFypPerformanceScore,
  findPlateauDay,
} from "../../fyp-performance";
import { gatherFanslyPostAnalyticsDatapoints } from "./helpers";

export const addDatapointsToPostMedia = async (
  postMediaId: string,
  response: FanslyAnalyticsResponse
): Promise<FanslyAnalyticsDatapoint[]> => {
  const dataSource = await db();
  const postMediaRepository = dataSource.getRepository(PostMedia);
  const dpRepo = dataSource.getRepository(FanslyAnalyticsDatapoint);
  const aggregateRepo = dataSource.getRepository(FanslyAnalyticsAggregate);

  const postMedia = await postMediaRepository.findOne({
    where: { id: postMediaId },
    relations: { post: { channel: true }, media: true },
  });

  if (!postMedia) {
    throw new Error("PostMedia not found");
  }

  if (postMedia.post.channel.typeId === "fansly" && response.response.aggregationData?.tags) {
    try {
      await saveHashtagsFromAnalytics(postMedia.post.channel.id, response);
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
        where: { timestamp: dp.timestamp, postMediaId },
      });

      if (existingDatapointForTimestamp) {
        const updatedDatapoint = dpRepo.merge(existingDatapointForTimestamp, { postMedia }, dp);
        return dpRepo.save(updatedDatapoint);
      }

      const newDatapoint = dpRepo.create({
        ...dp,
        postMedia,
        postMediaId,
      });
      return dpRepo.save(newDatapoint);
    })
  );

  const postMediaWithDatapoints = await postMediaRepository.findOne({
    where: { id: postMediaId },
    relations: {
      fanslyAnalyticsDatapoints: true,
      media: true,
      post: { channel: true },
    },
  });

  if (!postMediaWithDatapoints) {
    throw new Error("PostMedia not found after saving datapoints");
  }

  const aggregatedData = aggregatePostMediaAnalyticsData(postMediaWithDatapoints, false);

  const fypPerformanceScore = await calculateFypPerformanceScore(
    postMediaWithDatapoints,
    savedDatapoints
  );
  const fypMetrics = await calculateFypMetrics(postMediaWithDatapoints, savedDatapoints);
  const plateauDay = findPlateauDay(savedDatapoints);

  const fypPlateauDetectedAt = plateauDay > 0 ? new Date() : undefined;

  const existingAggregate = await aggregateRepo.findOne({
    where: { postMediaId },
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
      postMedia,
      postMediaId,
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

