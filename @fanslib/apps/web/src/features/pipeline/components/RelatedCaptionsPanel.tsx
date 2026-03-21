import type { CaptionQueueItem } from "@fanslib/server/schemas";
import { format } from "date-fns";
import { useQueries } from "@tanstack/react-query";
import { Copy } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { MediaTileLite } from "~/features/library/components/MediaTile/MediaTileLite";
import { api } from "~/lib/api/hono-client";

type RelatedCaptionsPanelProps = {
  relatedByMedia: CaptionQueueItem["relatedByMedia"];
  relatedByShoot: CaptionQueueItem["relatedByShoot"];
  currentCaption: string;
  onUseCaption: (caption: string) => void;
};

type RelatedItem =
  | (CaptionQueueItem["relatedByMedia"][number] & { type: "media" })
  | (CaptionQueueItem["relatedByShoot"][number] & { type: "shoot" });

export const RelatedCaptionsPanel = ({
  relatedByMedia,
  relatedByShoot,
  currentCaption,
  onUseCaption,
}: RelatedCaptionsPanelProps) => {
  const currentCaptionTrimmed = (currentCaption ?? "").trim();
  const allRelated: RelatedItem[] = [
    ...relatedByMedia.map((item) => ({ ...item, type: "media" as const })),
    ...relatedByShoot.map((item) => ({ ...item, type: "shoot" as const })),
  ].filter((item) => (item.caption?.trim() ?? "") !== currentCaptionTrimmed);

  // Group by caption text to deduplicate
  const groupedByCaption = allRelated.reduce(
    (acc, item) => {
      const key = item.caption?.trim() ?? "";
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    },
    {} as Record<string, RelatedItem[]>,
  );

  // Create deduplicated items with aggregated info
  const deduplicatedItems = Object.entries(groupedByCaption).map(([caption, items]) => ({
    caption,
    items,
    // Use first item's postId for query
    postId: items[0].postId,
  }));

  const postQueries = useQueries({
    queries: deduplicatedItems.map((item) => ({
      queryKey: ["posts", item.postId],
      queryFn: async () => {
        const result = await api.api.posts["by-id"][":id"].$get({ param: { id: item.postId } });
        if (!result.ok) {
          return null;
        }
        return await result.json();
      },
      enabled: !!item.postId,
    })),
  });

  const renderCaption = (caption: string | null) =>
    (caption ?? "").trim().length > 0 ? caption : "—";

  if (deduplicatedItems.length === 0) {
    return (
      <div className="rounded-lg py-4">
        <div className="text-sm font-medium mb-2 text-right">Related</div>
        <div className="text-xs text-base-content/60 text-right">No related captions</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg py-4 space-y-3">
      <div className="text-sm font-medium">Related</div>
      <div className="space-y-2">
        {deduplicatedItems.map((item, index) => {
          const postQuery = postQueries[index];
          const post =
            postQuery.data && typeof postQuery.data === "object" && "id" in postQuery.data
              ? postQuery.data
              : null;
          const firstMedia =
            post &&
            "postMedia" in post &&
            Array.isArray(post.postMedia) &&
            post.postMedia.length > 0
              ? post.postMedia[0]?.media
              : null;
          const isLoading = postQuery.isLoading;

          // Aggregate channels and dates
          const channels = item.items.map((i) => i.channelName);
          const uniqueChannels = Array.from(new Set(channels));
          const dates = item.items.map((i) => new Date(i.date));
          const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
          const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
          const dateRange =
            minDate.getTime() === maxDate.getTime()
              ? format(minDate, "MMM d")
              : `${format(minDate, "MMM d")} - ${format(maxDate, "MMM d")}`;

          // Get shoot name if any item is from shoot
          const shootItem = item.items.find((i) => i.type === "shoot");
          const shootName = shootItem?.type === "shoot" ? shootItem.shootName : null;

          // Create unique key from all post IDs in this group
          const groupKey = item.items
            .map((i) => i.postId)
            .sort()
            .join("-");

          return (
            <div key={groupKey} className="space-y-2 p-3 rounded-lg border border-black">
              <div className="flex items-start gap-3">
                {item.caption && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onUseCaption(item.caption ?? "")}
                    className="flex-shrink-0 h-9 w-9"
                  >
                    <Copy className="h-5 w-5" />
                  </Button>
                )}
                {isLoading ? (
                  <div className="w-16 aspect-square flex-shrink-0 bg-base-200 animate-pulse rounded" />
                ) : firstMedia ? (
                  <div className="w-16 aspect-square flex-shrink-0">
                    <MediaTileLite media={firstMedia} />
                  </div>
                ) : (
                  <div className="w-16 aspect-square flex-shrink-0 bg-base-200 rounded" />
                )}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="text-xs text-base-content/60">
                    {shootName && (
                      <>
                        <span className="font-medium">{shootName}</span>
                        {" • "}
                      </>
                    )}
                    {uniqueChannels.join(", ")} • {dateRange}
                    {item.items.length > 1 && (
                      <>
                        {" "}
                        • <span className="font-medium">{item.items.length} posts</span>
                      </>
                    )}
                  </div>
                  <div className="text-sm">{renderCaption(item.caption)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
