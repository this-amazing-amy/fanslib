import { Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import { useId, useMemo } from "react";
import { useObservedChartSize } from "~/hooks/useObservedChartSize";
import {
  formatChartAxisValue,
  metricLabels,
  metricValueFromAggregatedDay,
  type AnalyticsChartMetric,
} from "~/features/analytics/lib/chart-metric";
import { type AggregatedDataPoint, aggregateDatapoints } from "~/lib/analytics/aggregate";

export type ChartMetric = AnalyticsChartMetric;

type AnalyticsViewsChartProps = {
  datapoints: Array<{ timestamp: number; views: number; interactionTime: number }>;
  postDate: string;
  postMediaId: string;
  metric?: ChartMetric;
};

const defaultChartWidth = 600;
const chartHeightPx = 300;

const getMetricValue = (
  dp: AggregatedDataPoint,
  previous: AggregatedDataPoint | null,
  metric: ChartMetric,
): number =>
  metricValueFromAggregatedDay(
    { views: dp.views, interactionTime: dp.interactionTime },
    previous ? { views: previous.views, interactionTime: previous.interactionTime } : null,
    metric,
  );

export const AnalyticsViewsChart = ({
  datapoints,
  postDate,
  postMediaId: _postMediaId,
  metric = "views",
}: AnalyticsViewsChartProps) => {
  const glowFilterId = useId().replace(/:/g, "");
  const { containerRef, width, height } = useObservedChartSize(defaultChartWidth, chartHeightPx);

  const aggregatedData = useMemo(
    () => aggregateDatapoints(datapoints, postDate),
    [datapoints, postDate],
  );

  const chartData = useMemo(() => {
    if (aggregatedData.length === 0) return [];
    return aggregatedData.map((point, index) => ({
      date: point.date,
      value: getMetricValue(point, index > 0 ? (aggregatedData[index - 1] ?? null) : null, metric),
      views: point.views,
      interactionTime: point.interactionTime,
      timestamp: point.timestamp,
      daysSincePost: point.daysSincePost,
      dateLabel: new Date(point.timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    }));
  }, [aggregatedData, metric]);

  const sevenDayIndex = chartData.findIndex((d) => d.daysSincePost >= 7);
  const thirtyDayIndex = chartData.findIndex((d) => d.daysSincePost >= 30);

  const maxValue = Math.max(...chartData.map((d) => d.value), 0);

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <h3 className="mb-4 text-lg font-semibold">{metricLabels[metric]} Over Time</h3>
      <div
        ref={containerRef}
        className="relative w-full"
        style={{ minHeight: `${chartHeightPx}px` }}
      >
        {width > 0 ? (
          <LineChart
            width={width}
            height={height}
            data={chartData}
            margin={{
              left: 8,
              right: 8,
              top: 20,
              bottom: 8,
            }}
          >
            <XAxis
              dataKey="dateLabel"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tick={{ fill: "hsl(var(--bc) / 0.6)", fontSize: 11 }}
            />
            <YAxis
              domain={[0, maxValue * 1.1 || 1]}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v) => formatChartAxisValue(Number(v), metric)}
              width={56}
              tick={{ fill: "hsl(var(--bc) / 0.6)", fontSize: 11 }}
            />
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const datum = payload[0]?.payload as (typeof chartData)[number];
                return (
                  <div className="rounded-lg border border-base-300 bg-base-100 px-2.5 py-1.5 text-xs shadow-xl">
                    <div className="text-sm font-medium text-base-content">{datum.date}</div>
                    <div className="text-sm text-base-content/70">
                      {metricLabels[metric]}: {formatChartAxisValue(datum.value, metric)}
                    </div>
                    <div className="text-xs text-base-content/50">Day {datum.daysSincePost}</div>
                  </div>
                );
              }}
            />
            <Line
              dataKey="value"
              name={metricLabels[metric]}
              type="bump"
              stroke="var(--color-primary)"
              dot={false}
              strokeWidth={2}
              filter={`url(#${glowFilterId}-views)`}
              isAnimationActive={false}
            />
            <defs>
              <filter id={`${glowFilterId}-views`} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="10" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
          </LineChart>
        ) : null}

        {sevenDayIndex >= 0 && (
          <div
            className="pointer-events-none absolute top-0 h-[calc(100%-45px)] border-l-2 border-dashed border-amber-500"
            style={{
              left: `${Math.min(95, (sevenDayIndex / (chartData.length - 1)) * 100)}%`,
            }}
          >
            <div className="absolute -top-6 -translate-x-1/2 rounded bg-amber-50 px-1.5 py-0.5 text-xs font-medium whitespace-nowrap text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
              7 days
            </div>
          </div>
        )}

        {thirtyDayIndex >= 0 && (
          <div
            className="pointer-events-none absolute top-0 h-[calc(100%-45px)] border-l-2 border-dashed border-green-500"
            style={{
              left: `${Math.min(95, (thirtyDayIndex / (chartData.length - 1)) * 100)}%`,
            }}
          >
            <div className="absolute -top-6 -translate-x-1/2 rounded bg-green-50 px-1.5 py-0.5 text-xs font-medium whitespace-nowrap text-green-600 dark:bg-green-900/20 dark:text-green-400">
              30 days
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
