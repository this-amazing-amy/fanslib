import type { PostWithRelations } from '@fanslib/server/schemas';
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ErrorState } from "~/components/ui/ErrorState/ErrorState";
import { Input } from "~/components/ui/Input/Input";
import { Skeleton } from "~/components/ui/Skeleton";
import { usePostDrag } from "~/contexts/PostDragContext";
import { PostTimeline } from "~/features/posts/components/PostTimeline";
import {
  type CandidateStatus,
  useBulkConfirmCandidatesMutation,
  useCandidatesQuery,
  useConfirmMatchMutation,
  useIgnoreCandidateMutation,
  useUnignoreCandidateMutation,
  useUnmatchCandidateMutation,
} from "~/lib/queries/analytics";
import { usePostsQuery } from "~/lib/queries/posts";
import { CandidateCard } from "./CandidateCard";
import { SelectPostMediaDialog } from "./SelectPostMediaDialog";

type Post = PostWithRelations;

export const MatchingSection = () => {
  const [selectedStatus, setSelectedStatus] = useState<CandidateStatus>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectDialogState, setSelectDialogState] = useState<{
    post: Post;
    candidateFilename: string;
    candidateId: string;
  } | null>(null);
  const queryClient = useQueryClient();
  const { endPostDrag } = usePostDrag();

  const { data, isLoading, error, refetch } = useCandidatesQuery();

  const earliestCandidateDate = useMemo(() => {
    if (!data?.items || data.items.length === 0) return undefined;
    const dates = data.items.map((candidate) => candidate.fanslyCreatedAt * 1000);
    const earliest = Math.min(...dates);
    return new Date(earliest).toISOString();
  }, [data?.items]);

  const postsQueryParams = useMemo(() => {
    if (!earliestCandidateDate) return undefined;
    const filters: {
      dateRange: { startDate: string; endDate: string };
      search?: string;
      channelTypes: string[];
    } = {
      dateRange: {
        startDate: earliestCandidateDate,
        endDate: new Date().toISOString(),
      },
      channelTypes: ["fansly"],
    };
    if (searchQuery.trim()) {
      filters.search = searchQuery.trim();
    }
    return {
      filters: JSON.stringify(filters),
    };
  }, [earliestCandidateDate, searchQuery]);

  const {
    data: allPosts = [],
    isLoading: isLoadingPosts,
    refetch: refetchPostsQuery,
  } = usePostsQuery(postsQueryParams);

  const refetchPosts = async () => {
    await refetchPostsQuery();
  };

  const filteredCandidates = useMemo(
    () =>
      (data?.items ?? [])
        .filter((candidate) => candidate.status === selectedStatus)
        .sort((a, b) => a.fanslyCreatedAt - b.fanslyCreatedAt),
    [data?.items, selectedStatus]
  );

  const matchedPostMediaIds = useMemo(
    () =>
      new Set(
        (data?.items ?? []).flatMap((candidate) =>
          candidate.status === "matched" && candidate.matchedPostMediaId
            ? [candidate.matchedPostMediaId]
            : []
        )
      ),
    [data?.items]
  );

  const posts = useMemo(
    () =>
      allPosts
        .slice(0, 30)
        .filter((post) => post.postMedia.some((pm) => !matchedPostMediaIds.has(pm.id))),
    [allPosts, matchedPostMediaIds]
  );

  const confirmMatchMutation = useConfirmMatchMutation();
  const ignoreMutation = useIgnoreCandidateMutation();
  const unmatchMutation = useUnmatchCandidateMutation();
  const unignoreMutation = useUnignoreCandidateMutation();
  const bulkConfirmMutation = useBulkConfirmCandidatesMutation();

  const matchWithPostMediaId = async (candidateId: string, postMediaId: string) => {
    await confirmMatchMutation.mutateAsync({ candidateId, postMediaId });
    await queryClient.refetchQueries({
      queryKey: ["analytics", "candidates"],
      exact: true,
    });
  };

  const bulkConfirm = async () => {
    await bulkConfirmMutation.mutateAsync(0.95);
    await queryClient.refetchQueries({
      queryKey: ["analytics", "candidates"],
      exact: true,
    });
  };

  const ignoreCandidate = async (candidateId: string) => {
    await ignoreMutation.mutateAsync(candidateId);
    await queryClient.refetchQueries({
      queryKey: ["analytics", "candidates"],
      exact: true,
    });
  };

  const unmatchCandidate = async (candidateId: string) => {
    await unmatchMutation.mutateAsync(candidateId);
    await queryClient.refetchQueries({
      queryKey: ["analytics", "candidates"],
      exact: true,
    });
  };

  const unignoreCandidate = async (candidateId: string) => {
    await unignoreMutation.mutateAsync(candidateId);
    await queryClient.refetchQueries({
      queryKey: ["analytics", "candidates"],
      exact: true,
    });
  };

  const requestSelectPostMedia = (
    post: Post | null,
    candidateFilename: string,
    candidateId: string
  ) => {
    if (post) {
      setSelectDialogState({ post, candidateFilename, candidateId });
    }
  };

  const selectPostMedia = async (postMediaId: string) => {
    if (selectDialogState) {
      await matchWithPostMediaId(selectDialogState.candidateId, postMediaId);
      setSelectDialogState(null);
      endPostDrag();
    }
  };

  const tabs: Array<{ value: CandidateStatus; label: string; count: number }> = [
    {
      value: "pending",
      label: "Pending",
      count: data?.items.filter((c) => c.status === "pending").length ?? 0,
    },
    {
      value: "matched",
      label: "Matched",
      count: data?.items.filter((c) => c.status === "matched").length ?? 0,
    },
    {
      value: "ignored",
      label: "Ignored",
      count: data?.items.filter((c) => c.status === "ignored").length ?? 0,
    },
  ];

  return (
    <div className="h-full flex">
      <div className="w-96 flex-shrink-0 flex flex-col h-full overflow-hidden">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Candidates</h2>
            {selectedStatus === "pending" && filteredCandidates.length > 0 && (
              <button
                className="btn btn-primary btn-xs"
                onClick={bulkConfirm}
                disabled={bulkConfirmMutation.isPending}
              >
                {bulkConfirmMutation.isPending ? "..." : "Auto-match ≥95%"}
              </button>
            )}
          </div>
          <div className="tabs tabs-boxed tabs-sm">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                className={`tab ${selectedStatus === tab.value ? "tab-active" : ""}`}
                onClick={() => setSelectedStatus(tab.value)}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-1.5 text-xs opacity-70">({tab.count})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4">
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : error ? (
            <ErrorState
              title="Failed to load"
              description="Error fetching candidates."
              error={error instanceof Error ? error : new Error("Unknown error")}
              retry={{ onClick: () => refetch(), label: "Retry" }}
            />
          ) : filteredCandidates.length === 0 ? (
            <div className="text-center py-8 text-base-content/70">
              <p className="text-sm">No {selectedStatus} candidates.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCandidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  onMatchWithPostMediaId={(postMediaId) =>
                    matchWithPostMediaId(candidate.id, postMediaId)
                  }
                  onIgnore={() => ignoreCandidate(candidate.id)}
                  onUnmatch={() => unmatchCandidate(candidate.id)}
                  onUnignore={() => unignoreCandidate(candidate.id)}
                  onRequestSelectPostMedia={(post, candidateFilename) =>
                    requestSelectPostMedia(post, candidateFilename, candidate.id)
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0 h-full overflow-hidden flex flex-col">
        <div className="p-4 pb-2 mb-10 flex-shrink-0">
          <Input
            placeholder="Search posts by caption or date..."
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>
        <div className="flex-1 min-h-0 p-4 overflow-y-auto">
          {isLoadingPosts ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }, (_, i) => `skeleton-${i}`).map((id) => (
                <div
                  key={id}
                  className="border border-base-content rounded-xl bg-base-100 p-4"
                >
                  <div className="flex items-stretch justify-between gap-4">
                    <div className="flex flex-col justify-between gap-2 flex-1">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-start gap-2">
                          <Skeleton
                            variant="circular"
                            width={20}
                            height={20}
                            className="mt-1"
                          />
                          <div className="flex flex-col gap-1">
                            <Skeleton variant="text" width={120} height={20} />
                            <Skeleton variant="text" width={80} height={16} />
                          </div>
                        </div>
                        <Skeleton variant="text" width="80%" height={16} />
                      </div>
                      <div className="flex items-center gap-1">
                        <Skeleton
                          variant="rectangular"
                          width={60}
                          height={20}
                          className="rounded-full"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Skeleton
                        variant="rectangular"
                        width={64}
                        height={64}
                        className="rounded-lg"
                      />
                      <Skeleton
                        variant="rectangular"
                        width={64}
                        height={64}
                        className="rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <PostTimeline
              posts={posts as unknown as Post[]}
              onUpdate={refetchPosts}
              matchedPostMediaIds={matchedPostMediaIds}
            />
          )}
        </div>
      </div>
      {selectDialogState && (
        <SelectPostMediaDialog
          isOpen={selectDialogState !== null}
          onOpenChange={(open) => {
            if (!open) {
              setSelectDialogState(null);
            }
          }}
          post={selectDialogState.post}
          candidateFilename={selectDialogState.candidateFilename}
          onSelect={selectPostMedia}
          matchedPostMediaIds={matchedPostMediaIds}
        />
      )}
    </div>
  );
};
