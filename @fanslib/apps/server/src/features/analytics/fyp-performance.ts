import { db } from "../../lib/db";
import type { PostMedia } from "../posts/entity";
import type { FanslyAnalyticsDatapoint } from "./entity";

export type FypMetrics = {
  viewVelocity: number;
  sustainedGrowth: number;
  plateauPoint: number;
  isUnderperforming: boolean;
};

const calculateTimeSpanDays = (datapoints: FanslyAnalyticsDatapoint[]): number => {
  if (datapoints.length < 2) {
    return 0;
  }

  const firstTimestamp = datapoints[0]?.timestamp ?? 0;
  const lastTimestamp = datapoints[datapoints.length - 1]?.timestamp ?? 0;
  const timeDifferenceMs = lastTimestamp - firstTimestamp;
  const timeDifferenceDays = timeDifferenceMs / (1000 * 60 * 60 * 24);

  return Math.max(1, timeDifferenceDays);
};

const calculateSustainedGrowth = (datapoints: FanslyAnalyticsDatapoint[]): number => {
  if (datapoints.length < 3) {
    return 0;
  }

  const growthRates = datapoints.slice(1).map((dp, i) => {
    const prevViews = datapoints[i]?.views ?? 0;
    const currViews = dp.views;
    return prevViews > 0 ? ((currViews - prevViews) / prevViews) * 100 : 0;
  });

  const averageGrowthRate = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;

  return Math.max(0, averageGrowthRate);
};

const calculateUserPerformanceThreshold = async (
  channelId: string
): Promise<{
  averageViews: number;
  averageVelocity: number;
  averageEngagement: number;
}> => {
  const dataSource = await db();
  const postMediaRepository = dataSource.getRepository("PostMedia");

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const historicalPostMedia = await postMediaRepository
    .createQueryBuilder("postMedia")
    .leftJoinAndSelect("postMedia.post", "post")
    .leftJoinAndSelect("postMedia.fanslyAnalyticsAggregate", "analytics")
    .leftJoinAndSelect("postMedia.fanslyAnalyticsDatapoints", "datapoints")
    .where("post.channelId = :channelId", { channelId })
    .andWhere("post.createdAt >= :ninetyDaysAgo", { ninetyDaysAgo: ninetyDaysAgo.toISOString() })
    .andWhere("analytics.id IS NOT NULL")
    .getMany();

  if (historicalPostMedia.length === 0) {
    return {
      averageViews: 100,
      averageVelocity: 10,
      averageEngagement: 30,
    };
  }

  const totalViews = historicalPostMedia.reduce((sum, pm) => sum + (pm.fanslyAnalyticsAggregate?.totalViews ?? 0), 0);

  const totalEngagement = historicalPostMedia.reduce((sum, pm) => sum + (pm.fanslyAnalyticsAggregate?.averageEngagementSeconds ?? 0), 0);

  const averageViews = totalViews / historicalPostMedia.length;
  const averageEngagement = totalEngagement / historicalPostMedia.length;

  const velocities = historicalPostMedia
    .filter((pm) => pm.fanslyAnalyticsDatapoints && pm.fanslyAnalyticsDatapoints.length > 0)
    .map((pm) => {
      const timeSpanDays = calculateTimeSpanDays(pm.fanslyAnalyticsDatapoints ?? []);
      const pmViews = pm.fanslyAnalyticsAggregate?.totalViews ?? 0;
      return timeSpanDays > 0 ? pmViews / timeSpanDays : 0;
    });

  const averageVelocity = velocities.length > 0 
    ? velocities.reduce((sum, v) => sum + v, 0) / velocities.length 
    : 10;

  return {
    averageViews,
    averageVelocity,
    averageEngagement,
  };
};

export const calculateFypPerformanceScore = async (
  postMedia: PostMedia,
  datapoints: FanslyAnalyticsDatapoint[]
): Promise<number> => {
  if (datapoints.length === 0) {
    return 0;
  }

  const sortedDatapoints = [...datapoints].sort((a, b) => a.timestamp - b.timestamp);

  const totalViews = sortedDatapoints[sortedDatapoints.length - 1]?.views ?? 0;
  const totalEngagementTime = sortedDatapoints.reduce((sum, dp) => sum + dp.interactionTime, 0);
  const averageEngagementTime = totalEngagementTime / sortedDatapoints.length;

  const timeSpanDays = calculateTimeSpanDays(sortedDatapoints);
  const viewVelocity = timeSpanDays > 0 ? totalViews / timeSpanDays : 0;

  const userThreshold = await calculateUserPerformanceThreshold(postMedia.post.channelId);

  const viewScore = Math.min(100, (totalViews / Math.max(userThreshold.averageViews, 1)) * 50);
  const velocityScore = Math.min(
    100,
    (viewVelocity / Math.max(userThreshold.averageVelocity, 1)) * 30
  );
  const engagementScore = Math.min(
    100,
    (averageEngagementTime / Math.max(userThreshold.averageEngagement, 1)) * 20
  );

  const performanceScore = viewScore + velocityScore + engagementScore;

  return Math.min(100, Math.max(0, performanceScore));
};

export const findPlateauDay = (datapoints: FanslyAnalyticsDatapoint[]): number => {
  if (datapoints.length < 3) {
    return 0;
  }

  const sortedDatapoints = [...datapoints].sort((a, b) => a.timestamp - b.timestamp);

  const growthRates = sortedDatapoints.slice(1).map((dp, i) => {
    const prevViews = sortedDatapoints[i]?.views ?? 0;
    const currViews = dp.views;
    return prevViews > 0 ? ((currViews - prevViews) / prevViews) * 100 : 0;
  });

  const plateauThreshold = 5;
  const minConsecutivePeriods = 2;
  // eslint-disable-next-line functional/no-let
  let consecutiveLowGrowth = 0;
  // eslint-disable-next-line functional/no-let
  let plateauIndex = -1;

  growthRates.forEach((rate, i) => {
    if (rate < plateauThreshold) {
      consecutiveLowGrowth++;
      if (consecutiveLowGrowth >= minConsecutivePeriods && plateauIndex === -1) {
        plateauIndex = Math.max(0, i - minConsecutivePeriods + 1);
      }
    } else {
      consecutiveLowGrowth = 0;
    }
  });

  return plateauIndex >= 0 ? plateauIndex : 0;
};

export const calculateFypMetrics = async (
  postMedia: PostMedia,
  datapoints: FanslyAnalyticsDatapoint[]
): Promise<FypMetrics> => {
  if (datapoints.length === 0) {
    return {
      viewVelocity: 0,
      sustainedGrowth: 0,
      plateauPoint: 0,
      isUnderperforming: true,
    };
  }

  const sortedDatapoints = [...datapoints].sort((a, b) => a.timestamp - b.timestamp);

  const timeSpanDays = calculateTimeSpanDays(sortedDatapoints);
  const totalViews = sortedDatapoints[sortedDatapoints.length - 1]?.views ?? 0;
  const viewVelocity = timeSpanDays > 0 ? totalViews / timeSpanDays : 0;

  const sustainedGrowth = calculateSustainedGrowth(sortedDatapoints);
  const plateauPoint = findPlateauDay(sortedDatapoints);

  const userThreshold = await calculateUserPerformanceThreshold(postMedia.post.channelId);
  const isUnderperforming = totalViews < userThreshold.averageViews * 0.5;

  return {
    viewVelocity,
    sustainedGrowth,
    plateauPoint,
    isUnderperforming,
  };
};



