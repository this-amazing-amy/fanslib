type CandidateStatus = "pending" | "matched" | "ignored" | "no_match";

type Candidate = {
  id: string;
  fanslyStatisticsId: string;
  filename: string;
  caption: string | null;
  fanslyCreatedAt: number;
  matchConfidence: number | null;
  matchMethod: "exact_filename" | "fuzzy_filename" | "manual" | null;
  status: CandidateStatus;
};

type CandidateCardProps = {
  candidate: Candidate;
  onConfirmMatch: () => void;
  onIgnore: () => void;
};

const getConfidenceIcon = (confidence: number | null): string => {
  if (confidence === null) return "❓";
  if (confidence >= 1.0) return "✓";
  if (confidence >= 0.8) return "👍";
  if (confidence >= 0.5) return "⚠️";
  return "❌";
};

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString();
};

export const CandidateCard = ({ candidate, onConfirmMatch, onIgnore }: CandidateCardProps) => {
  const confidence = candidate.matchConfidence ?? 0;
  const icon = getConfidenceIcon(candidate.matchConfidence);

  return (
    <div className="card bg-base-200 shadow-sm">
      <div className="card-body p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-sm">{candidate.filename}</h3>
              {candidate.matchConfidence !== null && (
                <span className="text-xs text-base-content/70">
                  {icon} {confidence.toFixed(2)}
                </span>
              )}
            </div>
            {candidate.caption && (
              <p className="text-sm text-base-content/70 mb-2 line-clamp-2">
                {candidate.caption}
              </p>
            )}
            <div className="text-xs text-base-content/60">
              Captured: {formatDate(candidate.fanslyCreatedAt)}
            </div>
          </div>
          <div className="flex gap-2">
            {candidate.status === "pending" && (
              <>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={onConfirmMatch}
                >
                  Match
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={onIgnore}
                >
                  Ignore
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

