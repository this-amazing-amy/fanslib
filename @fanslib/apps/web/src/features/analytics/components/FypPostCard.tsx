import type { FypPostSchema } from "@fanslib/server/schemas";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { cn } from "~/lib/cn";
import { getMediaThumbnailUrl } from "~/lib/media-urls";

type FypPost = typeof FypPostSchema.static;

type FypPostCardProps = {
  post: FypPost;
  variant: "remove" | "repost";
  onRemove?: () => void;
  isRemoving?: boolean;
};

export const FypPostCard = ({
  post,
  variant,
  onRemove,
  isRemoving,
}: FypPostCardProps) => {
  const formatNumber = (num: number) =>
    num >= 1000 ? `${(num / 1000).toFixed(1)}k` : num.toFixed(0);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const isPositive = post.percentVsAverage > 0;
  const percentLabel = `${isPositive ? "+" : ""}${post.percentVsAverage.toFixed(0)}% vs avg`;

  return (
    <div className="flex items-stretch gap-3 p-3 bg-base-200 rounded-lg">
      {post.mediaId && (
        <img
          src={getMediaThumbnailUrl(post.mediaId)}
          alt=""
          className="w-16 h-16 object-cover rounded-md flex-shrink-0"
        />
      )}

      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-medium text-sm">{formatDate(post.postDate)}</div>
            <div className="text-xs text-base-content/60">
              {post.daysSincePosted} days ago
            </div>
          </div>

          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              isPositive ? "text-success" : "text-error"
            )}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {percentLabel}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 mt-1">
          <div className="flex items-center gap-3 text-xs text-base-content/70">
            <span>{formatNumber(post.totalViews)} views</span>
            <span>{post.avgEngagementSeconds.toFixed(0)}s engage</span>
            {variant === "remove" && post.plateauDaysSincePosted !== null && (
              <span className="text-warning">
                Plateaued day {post.plateauDaysSincePosted}
              </span>
            )}
          </div>

          {variant === "remove" && onRemove && (
            <Button
              variant="outline"
              size="xs"
              onPress={onRemove}
              isDisabled={isRemoving}
            >
              {isRemoving ? "..." : "Remove from FYP"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
