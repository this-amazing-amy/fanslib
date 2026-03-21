import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useRepostCandidatesQuery } from "~/lib/queries/analytics";
import { AnalyticsPostCard } from "./AnalyticsPostCard";

const SORT_OPTIONS = [
  { value: "views", label: "Views" },
  { value: "engagementPercent", label: "Engagement %" },
  { value: "engagementSeconds", label: "Engagement Time" },
] as const;

type SortBy = (typeof SORT_OPTIONS)[number]["value"];

export const RepostCandidatesPage = () => {
  const [sortBy, setSortBy] = useState<SortBy>("views");
  const { data: candidates, isLoading } = useRepostCandidatesQuery(sortBy);

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
          Loading repost candidates...
        </div>
      ) : !candidates || candidates.length === 0 ? (
        <div className="text-center py-12 text-base-content/50 text-sm">
          No repost candidates found
        </div>
      ) : (
        <div className="space-y-2">
          {candidates.map((candidate) => (
            <AnalyticsPostCard
              key={candidate.mediaId}
              mediaId={candidate.mediaId}
              caption={candidate.caption}
              totalViews={candidate.totalViews}
              averageEngagementPercent={candidate.averageEngagementPercent}
              averageEngagementSeconds={candidate.averageEngagementSeconds}
              timesPosted={candidate.timesPosted}
            />
          ))}
        </div>
      )}
    </div>
  );
};
