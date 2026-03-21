import { Loader2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/Button/Button";
import { useActiveFypPostsQuery } from "~/lib/queries/analytics";
import { useRemoveFromFypMutation } from "~/lib/queries/posts";
import { AnalyticsPostCard } from "./AnalyticsPostCard";

const SORT_OPTIONS = [
  { value: "views", label: "Views" },
  { value: "engagementPercent", label: "Engagement %" },
  { value: "engagementSeconds", label: "Engagement Time" },
] as const;

type SortBy = (typeof SORT_OPTIONS)[number]["value"];

export const ActiveFypPostsPage = () => {
  const [sortBy, setSortBy] = useState<SortBy>("views");
  const { data: posts, isLoading } = useActiveFypPostsQuery(sortBy);
  const removeFromFyp = useRemoveFromFypMutation();

  return (
    <div>
      {/* Sort Toggle */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-base-content/60">Sort by:</span>
        <div className="join">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={`join-item btn btn-sm ${sortBy === option.value ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setSortBy(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-base-content/50">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading active posts...
        </div>
      ) : !posts || posts.length === 0 ? (
        <div className="text-center py-12 text-base-content/50 text-sm">
          No active FYP posts found
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <AnalyticsPostCard
              key={post.postMediaId}
              mediaId={post.mediaId}
              caption={post.caption}
              totalViews={post.totalViews}
              averageEngagementPercent={post.averageEngagementPercent}
              averageEngagementSeconds={post.averageEngagementSeconds}
              actionSlot={
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => removeFromFyp.mutate(post.postId)}
                  isDisabled={removeFromFyp.isPending}
                >
                  <X className="w-4 h-4 mr-1" />
                  Remove
                </Button>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};
