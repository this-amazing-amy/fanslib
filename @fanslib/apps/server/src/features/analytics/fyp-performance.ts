import { db } from "../../lib/db";
import type { FanslyAnalyticsDatapoint } from "./entity";

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

export const calculateUserPerformanceThreshold = async (
  channelId: string
): Promise<{
  averageViews: number;
  averageVelocity: number;
  averageEngagementSeconds: number;
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
      averageEngagementSeconds: 30,
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
    averageEngagementSeconds: averageEngagement,
  };
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
