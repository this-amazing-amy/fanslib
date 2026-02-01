import type { OverlayTriggerState } from "react-stately";
import { ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { Sheet, SheetDescription, SheetHeader, SheetTitle } from "~/components/ui/Sheet";
import { Skeleton } from "~/components/ui/Skeleton";
import { useAnalyticsHealthQuery } from "~/lib/queries/analytics";
import { useFetchFanslyDataMutation } from "~/lib/queries/analytics";
import { getMediaThumbnailUrl } from "~/lib/media-urls";

type HealthDetailsDrawerProps = {
  state: OverlayTriggerState;
};

export const HealthDetailsDrawer = ({ state }: HealthDetailsDrawerProps) => {
  const { data: health, isLoading } = useAnalyticsHealthQuery();
  const fetchDataMutation = useFetchFanslyDataMutation();

  const refreshStalePost = async (postMediaId: string) => {
    await fetchDataMutation.mutateAsync({ postMediaId });
  };

  if (!state.isOpen) return null;

  return (
    <Sheet state={state} side="right" className="sm:max-w-md">
      <SheetHeader>
        <SheetTitle>Analytics Coverage</SheetTitle>
        <SheetDescription>
          Track how much of your Fansly content has analytics data
        </SheetDescription>
      </SheetHeader>

      {isLoading || !health ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <div className="space-y-6">
          <section className="bg-base-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Summary</h3>
            <p className="text-sm">
              <span className="font-medium">{health.matchedCount}</span> of{" "}
              <span className="font-medium">{health.totalCount}</span> Fansly posts
              tracked ({health.coveragePercent.toFixed(1)}%)
            </p>
          </section>

          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">
                Pending Matches ({health.pendingMatches})
              </h3>
              <Button
                variant="ghost"
                size="xs"
                className="gap-1"
                onPress={() => state.close()}
              >
                Go to Matching <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
            <p className="text-sm text-base-content/60">
              Posts captured from Fansly awaiting match confirmation
            </p>
            {health.highConfidenceMatches > 0 && (
              <p className="text-xs text-success mt-1">
                {health.highConfidenceMatches} high-confidence (auto-matchable)
              </p>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Stale Data ({health.staleCount})</h3>
            </div>
            <p className="text-sm text-base-content/60 mb-3">
              Haven&apos;t been updated in 3+ days
            </p>

            {health.stalePosts.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {health.stalePosts.map((post) => (
                  <div
                    key={post.postMediaId}
                    className="flex items-center gap-3 p-2 bg-base-200 rounded-lg"
                  >
                    {post.mediaId && (
                      <img
                        src={getMediaThumbnailUrl(post.mediaId)}
                        alt=""
                        className="w-10 h-10 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{post.mediaName}</p>
                      <p className="text-xs text-base-content/50">
                        Last update: {post.daysSinceUpdate} days ago
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="btn-circle"
                      onPress={() => refreshStalePost(post.postMediaId)}
                      isDisabled={fetchDataMutation.isPending}
                    >
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="font-semibold mb-2">
              Untracked Posts ({health.unmatchedCount})
            </h3>
            <p className="text-sm text-base-content/60">
              No statistics ID - browse Fansly to capture
            </p>
          </section>
        </div>
      )}
    </Sheet>
  );
};
