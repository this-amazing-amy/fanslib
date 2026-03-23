export type AnalyticsChartMetric = "views" | "engagementPercent" | "engagementSeconds";

type RawDatapoint = {
  timestamp: number;
  views: number;
  interactionTime: number;
};

export const metricLabels: Record<AnalyticsChartMetric, string> = {
  views: "Views",
  engagementPercent: "Engagement %",
  engagementSeconds: "Engagement Time (s)",
};

type CumulativeDayPoint = {
  views: number;
  interactionTime: number;
};

/**
 * Values for charts built from {@link aggregateDatapoints}: each point is end-of-day
 * cumulative views and interaction time. Engagement metrics use deltas from the previous day.
 */
export const metricValueFromAggregatedDay = (
  point: CumulativeDayPoint,
  previous: CumulativeDayPoint | null,
  metric: AnalyticsChartMetric,
): number => {
  if (metric === "views") {
    return point.views;
  }

  const dV = previous ? point.views - previous.views : point.views;
  const dT = previous ? point.interactionTime - previous.interactionTime : point.interactionTime;

  if (dV <= 0) return 0;

  const avgSecondsPerView = dT / 1000 / dV;
  return metric === "engagementSeconds" ? avgSecondsPerView : avgSecondsPerView * 100;
};

/**
 * Raw Fansly datapoint rows: each row is incremental views and interaction time for that
 * snapshot interval. Views are summed for a cumulative line; engagement uses that interval’s
 * average watch time per view.
 */
export const metricValueFromRawIncrements = (
  sortedDatapoints: RawDatapoint[],
  index: number,
  metric: AnalyticsChartMetric,
): number => {
  if (index < 0 || index >= sortedDatapoints.length) return 0;

  if (metric === "views") {
    return sortedDatapoints.slice(0, index + 1).reduce((s, d) => s + d.views, 0);
  }

  const dp = sortedDatapoints[index];
  if (dp.views <= 0) return 0;

  const avgSecondsPerView = dp.interactionTime / 1000 / dp.views;
  return metric === "engagementSeconds" ? avgSecondsPerView : avgSecondsPerView * 100;
};

export const formatChartAxisValue = (value: number, metric: AnalyticsChartMetric): string => {
  if (metric === "engagementSeconds") {
    return value.toFixed(1);
  }
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return Math.round(value).toString();
};
