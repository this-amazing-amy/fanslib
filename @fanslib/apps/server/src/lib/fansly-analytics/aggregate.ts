/* eslint-disable functional/no-loop-statements */
/* eslint-disable functional/no-let */
import type { PostMedia } from "../../features/posts/entity";
import { findPlateauStartIndex } from "./plateau-detection";

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
  const viewValues = dataPoints.map((p) => p.Views);
  const plateauStartIndex = findPlateauStartIndex(viewValues, minimumPointsToKeep);

  if (plateauStartIndex > 0) {
    return dataPoints.slice(0, plateauStartIndex + 3);
  }

  return dataPoints;
};

export const aggregatePostMediaAnalyticsData = (
  postMedia: PostMedia,
  trimPlateau = true,
): DataPoint[] => {
  if (postMedia.fanslyAnalyticsDatapoints?.length === 0) {
    return [];
  }

  const videoLengthMs = (postMedia.media?.duration ?? 0) * 1000;
  const postDate = new Date(postMedia.post.date);
  postDate.setHours(0, 0, 0, 0);

  const sortedDatapoints = [...postMedia.fanslyAnalyticsDatapoints].sort(
    (a, b) => a.timestamp - b.timestamp,
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
      (datapointDate.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24),
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
