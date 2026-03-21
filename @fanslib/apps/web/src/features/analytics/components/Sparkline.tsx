import { scaleLinear } from "@visx/scale";
import { useMemo } from "react";

type Datapoint = {
  timestamp: number;
  views: number;
  interactionTime: number;
};

type SparklineProps = {
  datapoints: Datapoint[];
  metric: "views" | "engagementPercent" | "engagementSeconds";
  width: number;
  height: number;
};

const getMetricValue = (dp: Datapoint, metric: SparklineProps["metric"]): number => {
  switch (metric) {
    case "views":
      return dp.views;
    case "engagementSeconds":
      return dp.interactionTime / 1000;
    case "engagementPercent":
      return dp.views > 0 ? (dp.interactionTime / 1000 / dp.views) * 100 : 0;
  }
};

export const Sparkline = ({ datapoints, metric, width, height }: SparklineProps) => {
  const pathD = useMemo(() => {
    if (datapoints.length < 2) return null;

    const values = datapoints.map((dp) => getMetricValue(dp, metric));
    const timestamps = datapoints.map((dp) => dp.timestamp);

    const xScale = scaleLinear({
      domain: [Math.min(...timestamps), Math.max(...timestamps)],
      range: [1, width - 1],
    });

    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const yScale = scaleLinear({
      domain: [minVal, maxVal === minVal ? minVal + 1 : maxVal],
      range: [height - 1, 1],
    });

    return datapoints
      .map((dp, i) => {
        const x = xScale(dp.timestamp);
        const y = yScale(getMetricValue(dp, metric));
        return `${i === 0 ? "M" : "L"}${x},${y}`;
      })
      .join(" ");
  }, [datapoints, metric, width, height]);

  if (!pathD) return null;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path
        d={pathD}
        fill="none"
        stroke="hsl(var(--p))"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
