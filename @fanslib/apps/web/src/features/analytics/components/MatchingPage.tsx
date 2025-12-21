import { useState } from "react";
import {
  type CandidateStatus,
  useBulkConfirmCandidatesMutation,
  useCandidatesQuery,
  useConfirmMatchMutation,
  useIgnoreCandidateMutation,
} from "~/lib/queries/analytics";
import { ErrorState } from "~/components/ui/ErrorState/ErrorState";
import { AnalyticsMatchDialog } from "./AnalyticsMatchDialog";
import { CandidateCard } from "./CandidateCard";

type Candidate = {
  id: string;
  fanslyStatisticsId: string;
  fanslyPostId: string;
  filename: string;
  caption: string | null;
  fanslyCreatedAt: number;
  position: number;
  mediaType: "image" | "video";
  status: CandidateStatus;
  matchedPostMediaId: string | null;
  matchConfidence: number | null;
  matchMethod: "exact_filename" | "fuzzy_filename" | "manual" | null;
  capturedAt: Date;
  matchedAt: Date | null;
};

export const MatchingPage = () => {
  const [selectedStatus, setSelectedStatus] = useState<CandidateStatus | "all">("pending");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data, isLoading, error, refetch } = useCandidatesQuery(
    selectedStatus === "all" ? undefined : selectedStatus
  );

  const confirmMatchMutation = useConfirmMatchMutation();
  const ignoreMutation = useIgnoreCandidateMutation();
  const bulkConfirmMutation = useBulkConfirmCandidatesMutation();

  const openMatchDialog = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsDialogOpen(true);
  };

  const handleConfirmMatch = (postMediaId: string) => {
    if (selectedCandidate) {
      confirmMatchMutation.mutate(
        { candidateId: selectedCandidate.id, postMediaId },
        {
          onSuccess: () => {
            setIsDialogOpen(false);
            setSelectedCandidate(null);
          },
        }
      );
    }
  };

  const handleBulkConfirm = () => {
    bulkConfirmMutation.mutate(0.95);
  };

  const tabs: Array<{ value: CandidateStatus | "all"; label: string }> = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "matched", label: "Matched" },
    { value: "ignored", label: "Ignored" },
    { value: "no_match", label: "No Match" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="tabs tabs-boxed">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              className={`tab ${selectedStatus === tab.value ? "tab-active" : ""}`}
              onClick={() => setSelectedStatus(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {selectedStatus === "pending" && (
          <button
            className="btn btn-primary btn-sm"
            onClick={handleBulkConfirm}
            disabled={bulkConfirmMutation.isPending}
          >
            {bulkConfirmMutation.isPending
              ? "Confirming..."
              : "Auto-confirm ≥95%"}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading candidates...</div>
      ) : error ? (
        <ErrorState
          title="Failed to load candidates"
          description="There was an error fetching candidates from the server."
          error={error instanceof Error ? error : new Error("Unknown error")}
          retry={{
            onClick: () => refetch(),
            label: "Retry",
          }}
        />
      ) : !data || data.items.length === 0 ? (
        <div className="text-center py-8 text-base-content/70">
          <p className="text-lg font-medium mb-2">No candidates found</p>
          <p className="text-sm">
            {selectedStatus === "all"
              ? "There are no candidates in the database."
              : `There are no ${selectedStatus} candidates.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              onConfirmMatch={() => openMatchDialog(candidate)}
              onIgnore={() => ignoreMutation.mutate(candidate.id)}
            />
          ))}
        </div>
      )}

      {selectedCandidate && (
        <AnalyticsMatchDialog
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false);
            setSelectedCandidate(null);
          }}
          candidate={selectedCandidate}
          onConfirm={handleConfirmMatch}
        />
      )}
    </div>
  );
};

