import { Repeat } from "lucide-react";
import { getMediaThumbnailUrl } from "~/lib/media-urls";

export type AnalyticsPostCardThumbnailColumnProps = {
  mediaId: string;
  timesPosted?: number;
};

export const AnalyticsPostCardThumbnailColumn = ({
  mediaId,
  timesPosted,
}: AnalyticsPostCardThumbnailColumnProps) => (
  <div className="flex w-20 shrink-0 flex-col items-center gap-1">
    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-base-300">
      <img
        src={getMediaThumbnailUrl(mediaId)}
        alt=""
        className="h-full w-full object-cover"
        loading="lazy"
      />
    </div>
    {timesPosted != null ? (
      <span
        className="flex w-full min-w-0 items-center justify-center gap-0.5 text-xs tabular-nums text-base-content/60"
        aria-label={timesPosted === 1 ? "Posted 1 time" : `Posted ${timesPosted} times`}
      >
        <Repeat className="h-3 w-3 shrink-0" aria-hidden />
        <span>{timesPosted}</span>
      </span>
    ) : null}
  </div>
);
