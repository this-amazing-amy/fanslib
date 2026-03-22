import { ParentSize } from "@visx/responsive";
import { AreaSeries, Axis, Grid, Tooltip, XYChart, buildChartTheme } from "@visx/xychart";
import { useMemo } from "react";
import { type AggregatedDataPoint, aggregateDatapoints } from "~/lib/analytics/aggregate";

export type ChartMetric = "views" | "engagementPercent" | "engagementSeconds";

type AnalyticsViewsChartProps = {
  datapoints: Array<{ timestamp: number; views: number; interactionTime: number }>;
  postDate: string;
  postMediaId: string;
  metric?: ChartMetric;
};

const chartTheme = buildChartTheme({
  colors: ["hsl(var(--p))"],
  gridColor: "hsl(var(--bc) / 0.1)",
  gridColorDark: "hsl(var(--bc) / 0.1)",
  backgroundColor: "transparent",
  tickLength: 4,
});

const formatNumber = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

export const metricLabels: Record<ChartMetric, string> = {
  views: "Views",
  engagementPercent: "Engagement %",
  engagementSeconds: "Engagement Time (s)",
};

const getMetricValue = (dp: AggregatedDataPoint, metric: ChartMetric): number => {
  switch (metric) {
    case "views":
      return dp.views;
    case "engagementSeconds":
      return dp.interactionTime / 1000;
    case "engagementPercent":
      return dp.views > 0 ? (dp.interactionTime / 1000 / dp.views) * 100 : 0;
  }
};

export const AnalyticsViewsChart = ({
  datapoints,
  postDate,
  metric = "views",
}: AnalyticsViewsChartProps) => {
  const aggregatedData = useMemo(
    () => aggregateDatapoints(datapoints, postDate),
    [datapoints, postDate],
  );

  if (aggregatedData.length === 0) {
    return null;
  }

  const chartData = aggregatedData.map((point) => ({
    date: point.date,
    value: getMetricValue(point, metric),
    views: point.views,
    interactionTime: point.interactionTime,
    timestamp: point.timestamp,
    daysSincePost: point.daysSincePost,
  }));

  const accessors = {
    xAccessor: (d: (typeof chartData)[number]) => new Date(d.timestamp),
    yAccessor: (d: (typeof chartData)[number]) => d.value,
  };

  const sevenDayIndex = chartData.findIndex((d) => d.daysSincePost >= 7);
  const thirtyDayIndex = chartData.findIndex((d) => d.daysSincePost >= 30);

  const maxValue = Math.max(...chartData.map((d) => d.value), 0);

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-4">{metricLabels[metric]} Over Time</h3>
      <div className="relative" style={{ minHeight: "300px" }}>
        <ParentSize>
          {({ width }) => (
            <XYChart
              theme={chartTheme}
              xScale={{ type: "time" }}
              yScale={{ type: "linear", domain: [0, maxValue * 1.1 || 1] }}
              width={width}
              height={300}
              margin={{ top: 20, right: 20, bottom: 40, left: 60 }}
            >
              <Grid columns={false} numTicks={4} />
              <Axis
                orientation="bottom"
                numTicks={5}
                tickFormat={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                }}
              />
              <Axis orientation="left" numTicks={5} tickFormat={formatNumber} />
              <AreaSeries
                dataKey={metricLabels[metric]}
                data={chartData}
                {...accessors}
                fillOpacity={0.2}
              />
              <Tooltip
                snapTooltipToDatumX
                snapTooltipToDatumY
                showVerticalCrosshair
                showSeriesGlyphs
                renderTooltip={({ tooltipData }) => {
                  if (!tooltipData?.nearestDatum) return null;
                  const datum = tooltipData.nearestDatum.datum as (typeof chartData)[number];
                  return (
                    <div className="bg-base-100 border border-base-300 rounded-lg p-2 shadow-lg">
                      <div className="text-sm font-medium">{datum.date}</div>
                      <div className="text-sm text-base-content/70">
                        {metricLabels[metric]}: {formatNumber(datum.value)}
                      </div>
                      <div className="text-xs text-base-content/50">Day {datum.daysSincePost}</div>
                    </div>
                  );
                }}
              />
            </XYChart>
          )}
        </ParentSize>

        {sevenDayIndex >= 0 && (
          <div
            className="absolute border-l-2 border-dashed border-amber-500 h-[calc(100%-45px)] top-0 pointer-events-none"
            style={{
              left: `${Math.min(95, (sevenDayIndex / (chartData.length - 1)) * 100)}%`,
            }}
          >
            <div className="absolute -top-6 -translate-x-1/2 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded text-xs text-amber-600 dark:text-amber-400 font-medium whitespace-nowrap">
              7 days
            </div>
          </div>
        )}

        {thirtyDayIndex >= 0 && (
          <div
            className="absolute border-l-2 border-dashed border-green-500 h-[calc(100%-45px)] top-0 pointer-events-none"
            style={{
              left: `${Math.min(95, (thirtyDayIndex / (chartData.length - 1)) * 100)}%`,
            }}
          >
            <div className="absolute -top-6 -translate-x-1/2 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded text-xs text-green-600 dark:text-green-400 font-medium whitespace-nowrap">
              30 days
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
