import { Eye, Percent, Repeat, Timer } from "lucide-react";
import type { ReactNode } from "react";
import { getMediaThumbnailUrl } from "~/lib/media-urls";

type AnalyticsPostCardProps = {
  mediaId: string;
  caption: string | null;
  totalViews: number;
  averageEngagementPercent: number;
  averageEngagementSeconds: number;
  timesPosted?: number;
  actionSlot?: ReactNode;
};

const formatEngagementSeconds = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.round(seconds % 60);
  return remaining > 0 ? `${minutes}m ${remaining}s` : `${minutes}m`;
};

export const AnalyticsPostCard = ({
  mediaId,
  caption,
  totalViews,
  averageEngagementPercent,
  averageEngagementSeconds,
  timesPosted,
  actionSlot,
}: AnalyticsPostCardProps) => (
  <div className="flex gap-3 p-3 rounded-xl bg-base-100 border">
    <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-base-300">
      <img
        src={getMediaThumbnailUrl(mediaId)}
        alt=""
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </div>

    <div className="flex-1 min-w-0 flex flex-col justify-between">
      {caption && (
        <div className="text-sm text-base-content line-clamp-2 mb-1">
          {caption}
        </div>
      )}

      <div className="flex items-center gap-3 text-xs text-base-content/60">
        <span className="flex items-center gap-1">
          <Eye className="w-3.5 h-3.5" />
          {totalViews.toLocaleString()}
        </span>
        <span className="flex items-center gap-1">
          <Percent className="w-3.5 h-3.5" />
          {averageEngagementPercent.toFixed(1)}%
        </span>
        <span className="flex items-center gap-1">
          <Timer className="w-3.5 h-3.5" />
          {formatEngagementSeconds(averageEngagementSeconds)}
        </span>
        {timesPosted != null && (
          <span className="flex items-center gap-1">
            <Repeat className="w-3.5 h-3.5" />
            {timesPosted}×
          </span>
        )}
      </div>
    </div>

    {actionSlot && <div className="shrink-0 flex items-center">{actionSlot}</div>}
  </div>
);
