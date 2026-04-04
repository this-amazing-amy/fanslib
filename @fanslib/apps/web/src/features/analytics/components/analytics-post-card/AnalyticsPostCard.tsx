import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { cn } from "~/lib/cn";
import type { AnalyticsChartMetric } from "~/features/analytics/lib/chart-metric";
import { GrowthChart } from "../GrowthChart";
import { Sparkline } from "../Sparkline";
import { AnalyticsPostCardCaption } from "./AnalyticsPostCardCaption";
import { AnalyticsPostCardMetaControls } from "./AnalyticsPostCardMetaControls";
import { AnalyticsPostCardMetrics } from "./AnalyticsPostCardMetrics";
import { AnalyticsPostCardThumbnailColumn } from "./AnalyticsPostCardThumbnailColumn";
import type { AnalyticsPostCardProps } from "./types";

export const AnalyticsPostCard = ({
  postId,
  mediaId,
  caption,
  totalViews,
  averageEngagementPercent,
  averageEngagementSeconds,
  datapoints,
  sortMetric,
  timesPosted,
  actionSlot,
  compact = false,
}: AnalyticsPostCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [chartMetric, setChartMetric] = useState<AnalyticsChartMetric>(() => sortMetric ?? "views");
  const canExpand = Boolean(datapoints && datapoints.length >= 2);
  const cardNavigatesToPost = postId != null && postId !== "";
  const showInlineSparkline = canExpand && !expanded && !compact;
  const showChartToggle = Boolean(cardNavigatesToPost && canExpand);

  return (
    <div
      data-testid="analytics-card"
      className={cn(
        "relative rounded-xl border bg-base-100",
        !cardNavigatesToPost && canExpand && "cursor-pointer",
      )}
      onClick={!cardNavigatesToPost && canExpand ? () => setExpanded((prev) => !prev) : undefined}
    >
      {cardNavigatesToPost && (
        <Link
          to="/posts/$postId"
          params={{ postId }}
          className="absolute inset-0 z-[1] rounded-xl transition-colors hover:bg-base-200/40"
          aria-label="View post"
        />
      )}

      <div
        className={cn(
          "relative z-[2] flex flex-col gap-2 p-3",
          cardNavigatesToPost && "pointer-events-none",
        )}
      >
        <div className="flex gap-3">
          <AnalyticsPostCardThumbnailColumn mediaId={mediaId} timesPosted={timesPosted} />

          <div className="flex min-h-20 min-w-0 flex-1 flex-col gap-2">
            <div className="flex w-full min-w-0 items-start justify-between gap-3">
              <div className="pointer-events-auto min-w-0 flex-1">
                <AnalyticsPostCardMetrics
                  averageEngagementSeconds={averageEngagementSeconds}
                  averageEngagementPercent={averageEngagementPercent}
                  totalViews={totalViews}
                  activeMetric={chartMetric}
                  chartInteractive={canExpand}
                  onMetricSelect={(metric) => {
                    setChartMetric(metric);
                  }}
                />
              </div>
              <AnalyticsPostCardMetaControls
                showChartToggle={showChartToggle}
                chartExpanded={expanded}
                onToggleChart={() => setExpanded((prev) => !prev)}
                actionSlot={actionSlot}
              />
            </div>

            {showInlineSparkline && datapoints ? (
              <button
                type="button"
                className={cn(
                  "relative z-10 pointer-events-auto w-full min-w-0 cursor-pointer rounded-md py-2 text-left outline-none transition-colors",
                  "hover:bg-base-300/60 focus-visible:ring-2 focus-visible:ring-primary/40",
                )}
                aria-label="Expand chart"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(true);
                }}
              >
                <span className="relative block w-full min-w-0">
                  <Sparkline datapoints={datapoints} metric={chartMetric} height={28} />
                  <span aria-hidden className="absolute inset-0 z-[1] cursor-pointer" />
                </span>
              </button>
            ) : null}

            {expanded && canExpand && datapoints ? (
              <div className={cn("min-w-0 w-full", cardNavigatesToPost && "pointer-events-auto")}>
                <GrowthChart datapoints={datapoints} metric={chartMetric} />
              </div>
            ) : null}

            {caption ? <AnalyticsPostCardCaption caption={caption} /> : null}
          </div>
        </div>
      </div>
    </div>
  );
};
