import { Loader2, MegaphoneOff } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/Button/Button";
import { useActiveFypPostsQuery } from "~/lib/queries/analytics";
import { AnalyticsPostCard } from "./analytics-post-card";
import type { FypAnalyticsSortBy } from "./FypAnalyticsSortSelect";
import { RemoveFromFypDialog } from "./RemoveFromFypDialog";

type RemoveFypTarget = {
  postId: string;
  fanslyPostId: string | null;
};

export type ActiveFypPostsPageProps = {
  sortBy: FypAnalyticsSortBy;
};

export const ActiveFypPostsPage = ({ sortBy }: ActiveFypPostsPageProps) => {
  const [removeTarget, setRemoveTarget] = useState<RemoveFypTarget | null>(null);
  const { data: posts, isLoading } = useActiveFypPostsQuery(sortBy);

  return (
    <div>
      <RemoveFromFypDialog
        postId={removeTarget?.postId ?? null}
        fanslyPostId={removeTarget?.fanslyPostId ?? null}
        isOpen={removeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
      />

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-base-content/50">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading poor performers...
        </div>
      ) : !posts || posts.length === 0 ? (
        <div className="text-center py-12 text-base-content/50 text-sm">
          No poor performers found
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <AnalyticsPostCard
              key={post.postMediaId}
              postId={post.postId}
              mediaId={post.mediaId}
              caption={post.caption}
              totalViews={post.totalViews}
              averageEngagementPercent={post.averageEngagementPercent}
              averageEngagementSeconds={post.averageEngagementSeconds}
              datapoints={post.datapoints}
              sortMetric={sortBy}
              actionSlot={
                <Button
                  variant="ghost"
                  size="icon"
                  onPress={() =>
                    setRemoveTarget({
                      postId: post.postId,
                      fanslyPostId: post.fanslyPostId ?? null,
                    })
                  }
                  aria-label="Stop FYP promotion"
                >
                  <MegaphoneOff className="h-4 w-4" />
                </Button>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};
