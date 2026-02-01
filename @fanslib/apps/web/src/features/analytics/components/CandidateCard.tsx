import { format } from "date-fns";
import { Link2, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import type { PostWithRelations, PostWithRelationsSchema } from '@fanslib/server/schemas';
import { MatchingStatusBadge } from "~/components/MatchingStatusBadge";
import { usePostDrag } from "~/contexts/PostDragContext";
import { cn } from "~/lib/cn";

type Post = PostWithRelations;

type CandidateStatus = "pending" | "matched" | "ignored";

type Candidate = {
  id: string;
  fanslyStatisticsId: string;
  filename: string;
  caption: string | null;
  fanslyCreatedAt: number;
  matchConfidence: number | null;
  matchMethod: "exact_filename" | "fuzzy_filename" | "manual" | "auto_detected" | null;
  status: CandidateStatus;
};

type CandidateCardProps = {
  candidate: Candidate;
  onMatchWithPostMediaId: (postMediaId: string) => void;
  onIgnore: () => void;
  onUnmatch: () => void;
  onUnignore: () => void;
  onRequestSelectPostMedia?: (post: Post, candidateFilename: string, candidateId: string) => void;
};

const getConfidenceIcon = (confidence: number | null): string => {
  if (confidence === null) return "❓";
  if (confidence >= 1.0) return "✓";
  if (confidence >= 0.8) return "👍";
  if (confidence >= 0.5) return "⚠️";
  return "❌";
};

export const CandidateCard = ({ candidate, onMatchWithPostMediaId, onIgnore, onUnmatch, onUnignore, onRequestSelectPostMedia }: CandidateCardProps) => {
  const confidence = candidate.matchConfidence ?? 0;
  const icon = getConfidenceIcon(candidate.matchConfidence);
  const [isDraggedOver, setIsDraggedOver] = useState(false);
  const { isDragging, draggedPost, endPostDrag } = usePostDrag();

  const handleDragOver = (e: React.DragEvent) => {
    if (!isDragging || candidate.status !== "pending") return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDragEnter = (e: React.DragEvent) => {
    if (!isDragging || candidate.status !== "pending") return;
    const relatedTarget = e.relatedTarget as Node | null;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      e.preventDefault();
      setIsDraggedOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!isDragging || candidate.status !== "pending") return;
    const relatedTarget = e.relatedTarget as Node | null;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      e.preventDefault();
      setIsDraggedOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggedOver(false);
    
    if (!draggedPost || candidate.status !== "pending") return;

    const matchingPostMedia = draggedPost.postMedia.find(
      (pm) => pm.media.name.toLowerCase() === candidate.filename.toLowerCase()
    );

    if (matchingPostMedia) {
      onMatchWithPostMediaId(matchingPostMedia.id);
      endPostDrag();
    } else if (draggedPost.postMedia.length === 1) {
      onMatchWithPostMediaId(draggedPost.postMedia[0].id);
      endPostDrag();
    } else if (onRequestSelectPostMedia) {
      onRequestSelectPostMedia(draggedPost, candidate.filename, candidate.id);
    }
  };

  const showDropZone = isDragging && candidate.status === "pending";

  return (
    <div
      className={cn(
        "border rounded-xl bg-base-100 relative transition-all",
        isDraggedOver ? "border-primary border-2 bg-primary/10" : "border-base-content",
        showDropZone && !isDraggedOver && "border-dashed border-primary/50"
      )}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-stretch justify-between p-4 gap-4">
        <div className="flex flex-col justify-between gap-2 flex-1 min-w-0">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <MatchingStatusBadge status={candidate.status} size="sm" className="flex-shrink-0" />
              <div className="flex items-baseline gap-2 min-w-0 flex-1">
                <span className="text-base font-semibold text-base-content flex-shrink-0">
                  {format(new Date(candidate.fanslyCreatedAt * 1000), "MMMM d")}
                </span>
                <span className="text-xs text-base-content/50 truncate min-w-0">
                  {candidate.filename}
                </span>
                {candidate.matchConfidence !== null && (
                  <span className="text-xs text-base-content/70 flex-shrink-0">
                    {icon} {confidence.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
            {candidate.caption && (
              <p className="text-sm text-base-content/70 line-clamp-2">
                {candidate.caption}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 items-start">
          {candidate.status === "pending" && (
            <button
              className="btn btn-ghost btn-sm btn-square"
              onClick={onIgnore}
              title="Ignore"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {candidate.status === "matched" && (
            <button
              className="btn btn-ghost btn-sm btn-square"
              onClick={onUnmatch}
              title="Unmatch"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          {candidate.status === "ignored" && (
            <>
              <button
                className="btn btn-ghost btn-sm btn-square"
                onClick={onUnignore}
                title="Restore"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
      {showDropZone && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
            isDraggedOver ? "bg-primary text-primary-content" : "bg-base-300 text-base-content/70"
          )}>
            <Link2 className="w-4 h-4" />
            Drop to match
          </div>
        </div>
      )}
    </div>
  );
};
