import { Eye, Percent, Timer } from "lucide-react";
import { cn } from "~/lib/cn";
import type { AnalyticsChartMetric } from "~/features/analytics/lib/chart-metric";
import { formatEngagementSeconds } from "./format-engagement-seconds";

export type AnalyticsPostCardMetricsProps = {
  averageEngagementSeconds: number;
  averageEngagementPercent: number;
  totalViews: number;
  activeMetric: AnalyticsChartMetric;
  onMetricSelect: (metric: AnalyticsChartMetric) => void;
  chartInteractive: boolean;
};

const metricButtonClass = (isActive: boolean, interactive: boolean) =>
  cn(
    "flex w-full min-w-0 items-center gap-2 rounded-md px-0.5 py-0.5 text-left transition-colors",
    interactive ? "cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-base-content/25" : "cursor-default",
    isActive ? "text-base-content/90" : "text-base-content/35",
  );

export const AnalyticsPostCardMetrics = ({
  averageEngagementSeconds,
  averageEngagementPercent,
  totalViews,
  activeMetric,
  onMetricSelect,
  chartInteractive,
}: AnalyticsPostCardMetricsProps) => {
  const isActive = (metric: AnalyticsChartMetric) => chartInteractive && activeMetric === metric;

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <button
        type="button"
        disabled={!chartInteractive}
        aria-pressed={isActive("engagementSeconds")}
        aria-label="Chart: engagement time"
        className={metricButtonClass(isActive("engagementSeconds"), chartInteractive)}
        onClick={(e) => {
          e.stopPropagation();
          onMetricSelect("engagementSeconds");
        }}
      >
        <Timer className="h-4 w-4 shrink-0" aria-hidden />
        <span className="text-xl font-bold leading-none tracking-tight tabular-nums">
          {formatEngagementSeconds(averageEngagementSeconds)}
        </span>
      </button>
      <button
        type="button"
        disabled={!chartInteractive}
        aria-pressed={isActive("engagementPercent")}
        aria-label="Chart: engagement percent"
        className={metricButtonClass(isActive("engagementPercent"), chartInteractive)}
        onClick={(e) => {
          e.stopPropagation();
          onMetricSelect("engagementPercent");
        }}
      >
        <Percent className="h-4 w-4 shrink-0" aria-hidden />
        <span className="text-xl font-bold leading-none tracking-tight tabular-nums">
          {averageEngagementPercent.toFixed(1)}%
        </span>
      </button>
      <button
        type="button"
        disabled={!chartInteractive}
        aria-pressed={isActive("views")}
        aria-label="Chart: views"
        className={metricButtonClass(isActive("views"), chartInteractive)}
        onClick={(e) => {
          e.stopPropagation();
          onMetricSelect("views");
        }}
      >
        <Eye className="h-4 w-4 shrink-0" aria-hidden />
        <span className="text-xl font-bold leading-none tracking-tight tabular-nums">
          {totalViews.toLocaleString()}
        </span>
      </button>
    </div>
  );
};
