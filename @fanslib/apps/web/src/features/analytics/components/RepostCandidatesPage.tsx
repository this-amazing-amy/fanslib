import type { Media } from "@fanslib/server/schemas";
import { Loader2, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "~/components/ui/Button";
import { CreatePostDialog } from "~/features/library/components/CreatePostDialog";
import { useRepostCandidatesQuery } from "~/lib/queries/analytics";
import { useChannelsQuery } from "~/lib/queries/channels";
import { useMediaQuery } from "~/lib/queries/library";
import { AnalyticsPostCard } from "./analytics-post-card";
import type { FypAnalyticsSortBy } from "./FypAnalyticsSortSelect";

const mediaPayloadForDialog = (data: unknown): Media[] => {
  if (!data || typeof data !== "object" || "error" in data) return [];
  return [data as Media];
};

export type RepostCandidatesPageProps = {
  sortBy: FypAnalyticsSortBy;
};

type CreatePostTarget = {
  mediaId: string;
  caption: string | null;
};

export const RepostCandidatesPage = ({ sortBy }: RepostCandidatesPageProps) => {
  const { data: candidates, isLoading } = useRepostCandidatesQuery(sortBy);
  const { data: channels = [] } = useChannelsQuery();
  const [createPostTarget, setCreatePostTarget] = useState<CreatePostTarget | null>(null);

  const firstFanslyChannelId = useMemo(
    () => channels.find((c) => c.type?.id === "fansly")?.id,
    [channels],
  );

  const { data: dialogMedia, isError: dialogMediaError } = useMediaQuery({
    id: createPostTarget?.mediaId ?? "",
  });

  useEffect(() => {
    if (dialogMediaError) setCreatePostTarget(null);
  }, [dialogMediaError]);

  const dialogMediaList = mediaPayloadForDialog(dialogMedia);
  const createDialogOpen = createPostTarget !== null && dialogMediaList.length > 0;

  return (
    <div>
      <CreatePostDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          if (!open) setCreatePostTarget(null);
        }}
        media={dialogMediaList}
        initialChannelId={firstFanslyChannelId}
        initialCaption={createPostTarget?.caption ?? undefined}
      />

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-base-content/50">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading repostables...
        </div>
      ) : !candidates || candidates.length === 0 ? (
        <div className="text-center py-12 text-base-content/50 text-sm">
          No repostables found
        </div>
      ) : (
        <div className="space-y-2">
          {candidates.map((candidate) => (
            <AnalyticsPostCard
              key={candidate.mediaId}
              postId={candidate.postId}
              mediaId={candidate.mediaId}
              caption={candidate.caption}
              totalViews={candidate.totalViews}
              averageEngagementPercent={candidate.averageEngagementPercent}
              averageEngagementSeconds={candidate.averageEngagementSeconds}
              datapoints={candidate.datapoints}
              sortMetric={sortBy}
              timesPosted={candidate.timesPosted}
              actionSlot={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Create post"
                  onPress={() =>
                    setCreatePostTarget({
                      mediaId: candidate.mediaId,
                      caption: candidate.caption,
                    })
                  }
                >
                  <Send className="w-4 h-4" />
                </Button>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};
