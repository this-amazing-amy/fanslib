/* eslint-disable functional/no-loop-statements */
/* eslint-disable functional/no-let */
import type { Post } from "../../features/posts/entity";

export type DataPoint = {
  date: string;
  daysSincePost: number;
  Views: number;
  averageWatchTimeSeconds: number;
  averageWatchTimePercent: number;
};

const ensureMonotonicViews = (dataPoints: DataPoint[]): DataPoint[] => {
  if (dataPoints.length <= 1) {
    return dataPoints;
  }

  const result = [...dataPoints];
  let maxViews = result[0]?.Views ?? 0;

  result.forEach((point, i) => {
    if (i > 0) {
      if (point.Views < maxViews) {
        result[i] = {
          ...point,
          Views: maxViews,
        };
      } else {
        maxViews = point?.Views ?? 0;
      }
    }
  });

  return result;
};

const trimDataAtPlateau = (dataPoints: DataPoint[]): DataPoint[] => {
  if (dataPoints.length <= 3) {
    return dataPoints;
  }

  const minimumPointsToKeep = Math.min(7, dataPoints.length);
  const changes: number[] = [];

  dataPoints.forEach((point, i) => {
    if (i > 0) {
      const absoluteChange = point.Views - (dataPoints[i - 1]?.Views ?? 0);
      const relativeChangePercent =
        (dataPoints[i - 1]?.Views ?? 0) === 0 ? 100 : (absoluteChange / (dataPoints[i - 1]?.Views ?? 0)) * 100;
      changes.push(relativeChangePercent);
    }
  });

  const movingAverageWindow = 3;
  const movingAverages: number[] = [];

  changes.forEach((_, i) => {
    const windowStart = Math.max(0, i - movingAverageWindow + 1);
    const windowSize = i - windowStart + 1;
    const sum = changes.slice(windowStart, i + 1).reduce((sum, val) => sum + val, 0);
    movingAverages.push(sum / windowSize);
  });

  let plateauStartIndex = -1;
  const maxChange = Math.max(...changes);
  const adaptiveThreshold = Math.min(maxChange * 0.05, 1.5);
  const consecutiveRequired = Math.min(4, Math.ceil(dataPoints.length * 0.1));
  let lowChangeCount = 0;

  movingAverages.forEach((avg, i) => {
    if (avg <= adaptiveThreshold) {
      lowChangeCount++;
      if (lowChangeCount >= consecutiveRequired && i >= minimumPointsToKeep - 2) {
        plateauStartIndex = i - lowChangeCount + 2;
      }
    } else {
      lowChangeCount = 0;
    }
  });

  if (plateauStartIndex > 0 && plateauStartIndex < dataPoints.length - 2) {
    return dataPoints.slice(0, plateauStartIndex + 3);
  }

  return dataPoints;
};

export const aggregatePostAnalyticsData = (post: Post, trimPlateau = true): DataPoint[] => {
  if (post.fanslyAnalyticsDatapoints?.length === 0) {
    return [];
  }

  const relevantMedia = post.postMedia[0];
  const videoLengthMs = (relevantMedia?.media?.duration ?? 0) * 1000;
  const postDate = new Date(post.date);
  postDate.setHours(0, 0, 0, 0);

  const sortedDatapoints = [...post.fanslyAnalyticsDatapoints].sort(
    (a, b) => a.timestamp - b.timestamp
  );

  const formatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const lastDatapointDate = new Date(sortedDatapoints[sortedDatapoints.length - 1]?.timestamp ?? 0);
  lastDatapointDate.setHours(0, 0, 0, 0);

  const datapointsByDay = new Map<string, DataPoint>();

  const initialPoint: DataPoint = {
    date: formatter.format(postDate),
    daysSincePost: 0,
    Views: 0,
    averageWatchTimeSeconds: 0,
    averageWatchTimePercent: 0,
  };
  datapointsByDay.set(postDate.toISOString().split("T")[0] ?? "", initialPoint);

  let cumulativeViews = 0;
  let cumulativeInteractionTime = 0;

  sortedDatapoints.forEach((datapoint) => {
    cumulativeViews += datapoint.views;
    cumulativeInteractionTime += datapoint.interactionTime;

    const averageWatchTimeMs =
      cumulativeViews > 0 ? cumulativeInteractionTime / cumulativeViews : 0;
    const averageWatchTimeSeconds = averageWatchTimeMs / 1000;
    const averageWatchTimePercent = videoLengthMs
      ? Math.round((averageWatchTimeMs / videoLengthMs) * 100)
      : 0;

    const datapointDate = new Date(datapoint.timestamp);
    datapointDate.setHours(0, 0, 0, 0);

    const daysSincePost = Math.floor(
      (datapointDate.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const dateKey = datapointDate.toISOString().split("T")[0] ?? "";

    datapointsByDay.set(dateKey, {
      date: formatter.format(datapointDate),
      daysSincePost,
      Views: cumulativeViews,
      averageWatchTimeSeconds,
      averageWatchTimePercent,
    });
  });

  const dataPoints: DataPoint[] = [];
  const dayMs = 24 * 60 * 60 * 1000;

  if (sortedDatapoints.length === 0) {
    return [initialPoint];
  }

  const allDateKeys: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (sortedDatapoints.length >= 2) {
    const endDate = new Date(Math.min(lastDatapointDate.getTime(), today.getTime()));

    for (
      let currentDate = new Date(postDate);
      currentDate <= endDate;
      currentDate = new Date(currentDate.getTime() + dayMs)
    ) {
      allDateKeys.push(currentDate.toISOString().split("T")[0] ?? "");
    }
  } else if (sortedDatapoints.length === 1) {
    allDateKeys.push(postDate.toISOString().split("T")[0] ?? "");
    const onlyDatapointDate = new Date(sortedDatapoints[0]?.timestamp ?? 0);
    onlyDatapointDate.setHours(0, 0, 0, 0);
    if (onlyDatapointDate.getTime() !== postDate.getTime()) {
      allDateKeys.push(onlyDatapointDate.toISOString().split("T")[0] ?? "");
    }
  } else {
    allDateKeys.push(postDate.toISOString().split("T")[0] ?? "");
  }

  const nextDataDateMap = new Map<string, string>();
  allDateKeys.forEach((currentKey, i) => {
    if (datapointsByDay.has(currentKey)) {
      nextDataDateMap.set(currentKey, currentKey);
      return;
    }

    let nextDataKey: string | null = null;
    for (let j = i + 1; j < allDateKeys.length; j++) {
      if (datapointsByDay.has(allDateKeys[j] ?? "")) {
        nextDataKey = allDateKeys[j] ?? null;
        break;
      }
    }

    if (nextDataKey) {
      nextDataDateMap.set(currentKey, nextDataKey);
    }
  });

  allDateKeys.forEach((dateKey, i) => {
    const currentDate = new Date(dateKey + "T00:00:00Z");

    if (datapointsByDay.has(dateKey)) {
      dataPoints.push(datapointsByDay.get(dateKey) ?? initialPoint);
      return;
    }

    let prevKey: string | null = null;
    for (let j = i - 1; j >= 0; j--) {
      if (datapointsByDay.has(allDateKeys[j] ?? "")) {
        prevKey = allDateKeys[j] ?? null;
        break;
      }
    }

    const nextKey = nextDataDateMap.get(dateKey);

    if (prevKey && nextKey) {
      const prevPoint = datapointsByDay.get(prevKey) ?? initialPoint;
      const nextPoint = datapointsByDay.get(nextKey) ?? initialPoint;

      const prevDate = new Date(prevKey + "T00:00:00Z");
      const nextDate = new Date(nextKey + "T00:00:00Z");

      const totalTimeSpan = nextDate.getTime() - prevDate.getTime();
      const currentTimeSpan = currentDate.getTime() - prevDate.getTime();
      const ratio = totalTimeSpan > 0 ? currentTimeSpan / totalTimeSpan : 0;

      const rawInterpolatedViews = prevPoint.Views + ratio * (nextPoint.Views - prevPoint.Views);
      const interpolatedViews = Math.max(rawInterpolatedViews, prevPoint.Views);

      const interpolatedWatchTimeSeconds =
        prevPoint.averageWatchTimeSeconds +
        ratio * (nextPoint.averageWatchTimeSeconds - prevPoint.averageWatchTimeSeconds);

      const interpolatedWatchTimePercent =
        prevPoint.averageWatchTimePercent +
        ratio * (nextPoint.averageWatchTimePercent - prevPoint.averageWatchTimePercent);

      const daysSincePost = Math.floor((currentDate.getTime() - postDate.getTime()) / dayMs);

      const interpolatedPoint: DataPoint = {
        date: formatter.format(currentDate),
        daysSincePost,
        Views: Math.max(Math.round(interpolatedViews), prevPoint.Views),
        averageWatchTimeSeconds: interpolatedWatchTimeSeconds,
        averageWatchTimePercent: Math.round(interpolatedWatchTimePercent),
      };

      datapointsByDay.set(dateKey, interpolatedPoint);
      dataPoints.push(interpolatedPoint);
    } else {
      const prevPointKey = prevKey ?? dateKey;
      const prevPoint = datapointsByDay.get(prevPointKey) ?? initialPoint;

      const daysSincePost = Math.floor((currentDate.getTime() - postDate.getTime()) / dayMs);

      const interpolatedPoint: DataPoint = {
        date: formatter.format(currentDate),
        daysSincePost,
        Views: Math.max(prevPoint.Views, 0),
        averageWatchTimeSeconds: prevPoint.averageWatchTimeSeconds,
        averageWatchTimePercent: prevPoint.averageWatchTimePercent,
      };

      datapointsByDay.set(dateKey, interpolatedPoint);
      dataPoints.push(interpolatedPoint);
    }
  });

  const processedDataPoints = ensureMonotonicViews(dataPoints);
  return trimPlateau ? trimDataAtPlateau(processedDataPoints) : processedDataPoints;
};



