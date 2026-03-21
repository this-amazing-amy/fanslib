import { ParentSize } from "@visx/responsive";
import { AreaSeries, Axis, Grid, Tooltip, XYChart, buildChartTheme } from "@visx/xychart";
import { useMemo } from "react";

type Datapoint = {
  timestamp: number;
  views: number;
  interactionTime: number;
};

type GrowthChartProps = {
  datapoints: Datapoint[];
  metric: "views" | "engagementPercent" | "engagementSeconds";
};

const chartTheme = buildChartTheme({
  colors: ["hsl(var(--p))"],
  gridColor: "hsl(var(--bc) / 0.1)",
  gridColorDark: "hsl(var(--bc) / 0.1)",
  backgroundColor: "transparent",
  tickLength: 4,
});

const formatNumber = (value: number): string => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return Math.round(value).toString();
};

const metricLabels = {
  views: "Views",
  engagementPercent: "Engagement %",
  engagementSeconds: "Engagement Time (s)",
} as const;

const getMetricValue = (dp: Datapoint, metric: GrowthChartProps["metric"]): number => {
  switch (metric) {
    case "views":
      return dp.views;
    case "engagementSeconds":
      return dp.interactionTime / 1000;
    case "engagementPercent":
      return dp.views > 0 ? (dp.interactionTime / 1000 / dp.views) * 100 : 0;
  }
};

export const GrowthChart = ({ datapoints, metric }: GrowthChartProps) => {
  const chartData = useMemo(() => {
    const sorted = [...datapoints].sort((a, b) => a.timestamp - b.timestamp);
    return sorted.map((dp) => ({
      timestamp: dp.timestamp,
      value: getMetricValue(dp, metric),
    }));
  }, [datapoints, metric]);

  if (chartData.length < 2) return null;

  const maxValue = Math.max(...chartData.map((d) => d.value), 0);

  const accessors = {
    xAccessor: (d: (typeof chartData)[number]) => new Date(d.timestamp),
    yAccessor: (d: (typeof chartData)[number]) => d.value,
  };

  return (
    <div data-testid="growth-chart" className="mt-2" style={{ minHeight: "200px" }}>
      <ParentSize>
        {({ width }) => (
          <XYChart
            theme={chartTheme}
            xScale={{ type: "time" }}
            yScale={{ type: "linear", domain: [0, maxValue * 1.1 || 1] }}
            width={width}
            height={200}
            margin={{ top: 10, right: 10, bottom: 30, left: 50 }}
          >
            <Grid columns={false} numTicks={4} />
            <Axis
              orientation="bottom"
              numTicks={4}
              tickFormat={(value) => {
                const date = new Date(value as number);
                return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              }}
            />
            <Axis orientation="left" numTicks={4} tickFormat={formatNumber} />
            <AreaSeries dataKey={metricLabels[metric]} data={chartData} {...accessors} fillOpacity={0.2} />
            <Tooltip
              snapTooltipToDatumX
              snapTooltipToDatumY
              showVerticalCrosshair
              showSeriesGlyphs
              renderTooltip={({ tooltipData }) => {
                if (!tooltipData?.nearestDatum) return null;
                const datum = tooltipData.nearestDatum.datum as (typeof chartData)[number];
                const date = new Date(datum.timestamp);
                return (
                  <div className="bg-base-100 border border-base-300 rounded-lg p-2 shadow-lg">
                    <div className="text-sm font-medium">
                      {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                    <div className="text-sm text-base-content/70">
                      {metricLabels[metric]}: {formatNumber(datum.value)}
                    </div>
                  </div>
                );
              }}
            />
          </XYChart>
        )}
      </ParentSize>
    </div>
  );
};
