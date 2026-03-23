import { Line, LineChart } from "recharts";
import { useId, useMemo } from "react";
import { useObservedChartSize } from "~/hooks/useObservedChartSize";
import { cn } from "~/lib/cn";
import { metricValueFromRawIncrements, type AnalyticsChartMetric } from "../lib/chart-metric";

type Datapoint = {
  timestamp: number;
  views: number;
  interactionTime: number;
};

type SparklineProps = {
  datapoints: Datapoint[];
  metric: AnalyticsChartMetric;
  width?: number;
  height?: number;
  className?: string;
};

export const Sparkline = ({
  datapoints,
  metric,
  width: widthProp,
  height = 24,
  className,
}: SparklineProps) => {
  const glowFilterId = useId().replace(/:/g, "");
  const { containerRef, width: observedWidth } = useObservedChartSize(widthProp ?? 120, height);
  const chartWidth = widthProp ?? observedWidth;
  const chartData = useMemo(() => {
    const sorted = [...datapoints].sort((a, b) => a.timestamp - b.timestamp);
    return sorted.map((dp, index) => ({
      timestamp: dp.timestamp,
      value: metricValueFromRawIncrements(sorted, index, metric),
    }));
  }, [datapoints, metric]);

  if (chartData.length < 2) return null;

  return (
    <div
      ref={widthProp === undefined ? containerRef : undefined}
      className={cn(widthProp === undefined && "w-full min-w-0", className)}
    >
      {chartWidth > 0 ? (
        <LineChart
          width={chartWidth}
          height={height}
          data={chartData}
          margin={{ left: 0, right: 0, top: 2, bottom: 2 }}
        >
          <Line
            dataKey="value"
            type="bump"
            stroke="var(--color-primary)"
            dot={false}
            strokeWidth={1.5}
            filter={`url(#${glowFilterId}-spark)`}
            isAnimationActive={false}
          />
          <defs>
            <filter id={`${glowFilterId}-spark`} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
        </LineChart>
      ) : null}
    </div>
  );
};
