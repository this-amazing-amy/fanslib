import { useState } from "react";
import { ErrorState } from "~/components/ui/ErrorState/ErrorState";
import { Skeleton } from "~/components/ui/Skeleton";
import { useFypActionsQuery } from "~/lib/queries/analytics";
import { useRemoveFromFypMutation } from "~/lib/queries/posts";
import { FypPostCard } from "./FypPostCard";
import { ThresholdSelector } from "./ThresholdSelector";

type ThresholdType = "views" | "engagement";

export const FypActionItemsSection = () => {
  const [thresholdType, setThresholdType] = useState<ThresholdType>("views");
  const [customThreshold, setCustomThreshold] = useState<number | null>(null);

  const { data, isLoading, error, refetch } = useFypActionsQuery({
    thresholdType,
    thresholdValue: customThreshold ?? undefined,
  });

  const removeFromFypMutation = useRemoveFromFypMutation();

  const removeFromFyp = async (postId: string) => {
    await removeFromFypMutation.mutateAsync(postId);
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        <Skeleton className="h-10 w-full max-w-lg" />
        <div className="space-y-2">
          {Array.from({ length: 3 }, (_, i) => `skeleton-${i}`).map((id) => (
            <Skeleton key={id} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <ErrorState
          title="Failed to load FYP data"
          description="Could not fetch FYP action items."
          error={error instanceof Error ? error : new Error("Unknown error")}
          retry={{ onClick: () => refetch(), label: "Retry" }}
        />
      </div>
    );
  }

  if (!data) return null;

  const defaultThreshold =
    thresholdType === "views"
      ? data.userAverageViews * 0.5
      : data.userAverageEngagementSeconds * 0.5;

  const thresholdValue = customThreshold ?? defaultThreshold;

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6">
      <ThresholdSelector
        thresholdType={thresholdType}
        thresholdValue={thresholdValue}
        userAverageViews={data.userAverageViews}
        userAverageEngagementSeconds={data.userAverageEngagementSeconds}
        onThresholdTypeChange={(type) => {
          setThresholdType(type);
          setCustomThreshold(null);
        }}
        onThresholdValueChange={setCustomThreshold}
      />

      <section>
        <div className="mb-3">
          <h2 className="text-lg font-semibold">
            Consider Removing ({data.considerRemoving.length})
          </h2>
          <p className="text-sm text-base-content/60">
            Plateaued and below your threshold - freeing slots might help
          </p>
        </div>

        {data.considerRemoving.length === 0 ? (
          <p className="text-sm text-base-content/50 py-4">
            No posts match the criteria.
          </p>
        ) : (
          <div className="space-y-2">
            {data.considerRemoving.map((post) => (
              <FypPostCard
                key={post.postId}
                post={post}
                variant="remove"
                onRemove={() => removeFromFyp(post.postId)}
                isRemoving={removeFromFypMutation.isPending}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3">
          <h2 className="text-lg font-semibold">
            Ready to Repost ({data.readyToRepost.length})
          </h2>
          <p className="text-sm text-base-content/60">
            Performed well, naturally expired - eligible for another run
          </p>
          <p className="text-xs text-base-content/40 mt-1">
            Only shows posts that completed their full 90-day FYP cycle
          </p>
        </div>

        {data.readyToRepost.length === 0 ? (
          <p className="text-sm text-base-content/50 py-4">
            No posts are ready for reposting yet.
          </p>
        ) : (
          <div className="space-y-2">
            {data.readyToRepost.map((post) => (
              <FypPostCard key={post.postId} post={post} variant="repost" />
            ))}
          </div>
        )}
      </section>

      <div className="text-sm text-base-content/60 pt-4 border-t border-base-300">
        Currently active on FYP: {data.activeOnFypCount} posts (day 0-90)
      </div>
    </div>
  );
};
