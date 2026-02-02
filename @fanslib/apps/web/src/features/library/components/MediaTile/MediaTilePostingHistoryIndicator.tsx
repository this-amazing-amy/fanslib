import { Clock } from "lucide-react";
import { useMemo } from "react";
import { Tooltip } from "~/components/ui/Tooltip";
import { formatDistanceToNow } from "date-fns";

type PostingHistoryData = {
  totalPosts: number;
  lastPostedAt: string | null;
  postsByChannel: Array<{
    id: string;
    date: string;
    channelId: string;
    channel: {
      id: string;
      name: string;
      type: {
        id: string;
        name: string;
        color: string | null;
      };
    };
  }>;
};

type MediaTilePostingHistoryIndicatorProps = {
  history: PostingHistoryData;
  currentChannelId?: string;
  isWithinCooldown?: boolean;
};

export const MediaTilePostingHistoryIndicator = ({
  history,
  currentChannelId,
  isWithinCooldown = false,
}: MediaTilePostingHistoryIndicatorProps) => {
  const lastPostToCurrentChannel = useMemo(() => {
    if (!currentChannelId) return null;
    return history.postsByChannel.find((p) => p.channelId === currentChannelId);
  }, [history.postsByChannel, currentChannelId]);

  const lastPostOverall = useMemo(() => {
    if (history.postsByChannel.length === 0) return null;
    return history.postsByChannel[0];
  }, [history.postsByChannel]);

  // Don't show indicator if no posts
  if (history.totalPosts === 0) return null;

  const tooltipContent = (
    <div className="space-y-1.5">
      <div className="font-semibold text-xs">
        Posted {history.totalPosts} {history.totalPosts === 1 ? "time" : "times"}
      </div>
      {lastPostToCurrentChannel && (
        <div className="text-xs">
          <div className="text-white/90">
            Last posted to {lastPostToCurrentChannel.channel.name}:
          </div>
          <div className="text-white/70">
            {formatDistanceToNow(new Date(lastPostToCurrentChannel.date), { addSuffix: true })}
          </div>
        </div>
      )}
      {lastPostOverall && lastPostOverall.channelId !== currentChannelId && (
        <div className="text-xs">
          <div className="text-white/90">
            Last posted to {lastPostOverall.channel.name}:
          </div>
          <div className="text-white/70">
            {formatDistanceToNow(new Date(lastPostOverall.date), { addSuffix: true })}
          </div>
        </div>
      )}
      {isWithinCooldown && (
        <div className="text-xs text-warning/90 pt-1 border-t border-white/10">
          ⚠️ Within repost cooldown
        </div>
      )}
    </div>
  );

  return (
    <Tooltip
      content={tooltipContent}
      placement="top"
      className="bg-black/90 text-white border-white/20 max-w-xs"
    >
      <div
        className="size-5 p-1 rounded bg-black/50 flex items-center justify-center"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <Clock className="w-3 h-3 text-white" />
      </div>
    </Tooltip>
  );
};
