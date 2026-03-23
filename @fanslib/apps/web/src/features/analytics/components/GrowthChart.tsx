import { Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import { useId, useMemo } from "react";
import { useObservedChartSize } from "~/hooks/useObservedChartSize";
import {
  formatChartAxisValue,
  metricLabels,
  metricValueFromRawIncrements,
  type AnalyticsChartMetric,
} from "../lib/chart-metric";

type Datapoint = {
  timestamp: number;
  views: number;
  interactionTime: number;
};

type GrowthChartProps = {
  datapoints: Datapoint[];
  metric: AnalyticsChartMetric;
};

const defaultChartWidth = 400;
const chartHeightPx = 200;

export const GrowthChart = ({ datapoints, metric }: GrowthChartProps) => {
  const glowFilterId = useId().replace(/:/g, "");
  const { containerRef, width, height } = useObservedChartSize(defaultChartWidth, chartHeightPx);

  const chartData = useMemo(() => {
    const sorted = [...datapoints].sort((a, b) => a.timestamp - b.timestamp);
    return sorted.map((dp, index) => ({
      timestamp: dp.timestamp,
      value: metricValueFromRawIncrements(sorted, index, metric),
      dateLabel: new Date(dp.timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    }));
  }, [datapoints, metric]);

  if (chartData.length < 2) return null;

  return (
    <div
      ref={containerRef}
      data-testid="growth-chart"
      className="mt-2 w-full"
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
            top: 10,
            bottom: 8,
          }}
        >
          <XAxis
            dataKey="dateLabel"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={24}
            tick={{ fill: "hsl(var(--bc) / 0.6)", fontSize: 11 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(v) => formatChartAxisValue(Number(v), metric)}
            width={48}
            tick={{ fill: "hsl(var(--bc) / 0.6)", fontSize: 11 }}
          />
          <Tooltip
            cursor={false}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0]?.payload as (typeof chartData)[number];
              const v = payload[0]?.value;
              return (
                <div className="rounded-lg border border-base-300 bg-base-100 px-2.5 py-1.5 text-xs shadow-xl">
                  <div className="font-medium text-base-content">
                    {new Date(row.timestamp).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                  <div className="text-base-content/70">
                    {metricLabels[metric]}: {formatChartAxisValue(Number(v), metric)}
                  </div>
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
            filter={`url(#${glowFilterId})`}
            isAnimationActive={false}
          />
          <defs>
            <filter id={glowFilterId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="10" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
        </LineChart>
      ) : null}
    </div>
  );
};
