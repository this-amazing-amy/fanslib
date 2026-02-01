import type { CaptionQueueItem } from '@fanslib/server/schemas';
import { format } from "date-fns";
import { useQueries } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { MediaTileLite } from "~/features/library/components/MediaTile/MediaTileLite";
import { api } from "~/lib/api/hono-client";


type RelatedCaptionsPanelProps = {
  relatedByMedia: CaptionQueueItem["relatedByMedia"];
  relatedByShoot: CaptionQueueItem["relatedByShoot"];
  onUseCaption: (caption: string) => void;
};

type RelatedItem = 
  | (CaptionQueueItem["relatedByMedia"][number] & { type: "media" })
  | (CaptionQueueItem["relatedByShoot"][number] & { type: "shoot" });

export const RelatedCaptionsPanel = ({ relatedByMedia, relatedByShoot, onUseCaption }: RelatedCaptionsPanelProps) => {

  const allRelated: RelatedItem[] = [
    ...relatedByMedia.map((item) => ({ ...item, type: "media" as const })),
    ...relatedByShoot.map((item) => ({ ...item, type: "shoot" as const })),
  ];

  const postQueries = useQueries({
    queries: allRelated.map((item) => ({
      queryKey: ["posts", item.postId],
      queryFn: async () => {
        const result = await api.api.posts['by-id'][':id'].$get({ param: { id: item.postId } });
        if (!result.ok) {
          return null;
        }
        return await result.json();
      },
      enabled: !!item.postId,
    })),
  });

  const renderCaption = (caption: string | null) => (caption ?? "").trim().length > 0 ? caption : "—";

  if (allRelated.length === 0) {
    return (
      <div className="rounded-lg border border-base-300 p-4">
        <div className="text-sm font-medium mb-2 text-right">Related</div>
        <div className="text-xs text-base-content/60 text-right">No related captions</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-base-300 p-4 space-y-3">
      <div className="text-sm font-medium">Related</div>
      <div className="space-y-4">
        {allRelated.map((item, index) => {
          const postQuery = postQueries[index];
          const post = postQuery.data && typeof postQuery.data === "object" && "id" in postQuery.data ? postQuery.data : null;
          const firstMedia = post && "postMedia" in post && Array.isArray(post.postMedia) && post.postMedia.length > 0 
            ? post.postMedia[0]?.media 
            : null;
          const shootName = item.type === "shoot" ? item.shootName : null;
          const isLoading = postQuery.isLoading;

          return (
            <div key={item.postId} className="space-y-2 pb-4 border-b border-base-300 last:border-0 last:pb-0">
              <div className="flex items-start gap-3">
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
                    {item.channelName} • {format(new Date(item.date), "MMM d")}
                  </div>
                  <div className="text-sm">{renderCaption(item.caption)}</div>
                  {item.caption && (
                    <Button size="xs" variant="ghost" onClick={() => onUseCaption(item.caption ?? "")}>
                      <ArrowLeft className="h-3 w-3 mr-1" />
                      Use
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
