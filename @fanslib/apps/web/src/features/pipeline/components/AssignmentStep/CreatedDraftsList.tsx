import { format } from "date-fns";
import { CheckCircle2, FileX, ImagePlus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { AssignMediaResponse, AssignMediaResponseSchema, PostWithRelations, PostWithRelationsSchema } from '@fanslib/server/schemas';
import { MediaTileLite } from "~/features/library/components/MediaTile/MediaTileLite";
import { ChannelBadge } from "~/components/ChannelBadge";
import { ContentScheduleBadge } from "~/components/ContentScheduleBadge";
import { Button } from "~/components/ui/Button";

type CreatedDraftsListProps = {
  drafts: PostWithRelations[];
  fromDate: Date;
  toDate: Date;
  assignmentResult: AssignMediaResponse | null;
  onAssignMedia?: (draftId: string) => void;
};

export const CreatedDraftsList = ({ drafts, fromDate, toDate, assignmentResult, onAssignMedia }: CreatedDraftsListProps) => {
  const filteredDrafts = drafts.filter((draft) => {
    const draftDate = new Date(draft.date);
    return draftDate >= fromDate && draftDate <= toDate && draft.status === "draft";
  });

  const draftsWithMedia = filteredDrafts
    .filter((draft) => (draft.postMedia?.length ?? 0) > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const draftsWithoutMedia = filteredDrafts
    .filter((draft) => (draft.postMedia?.length ?? 0) === 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const draftsCreatedCount = assignmentResult?.created ?? 0;
  const preExistingCount = Math.max(0, draftsWithMedia.length - draftsCreatedCount);

  return (
    <div className="space-y-4">
      {filteredDrafts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-base font-medium">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span>
              {draftsCreatedCount} {draftsCreatedCount === 1 ? "Draft" : "Drafts"} created
              {preExistingCount > 0 && (
                <span className="text-base-content/60">
                  {" "}({preExistingCount} pre-existing)
                </span>
              )}
            </span>
          </div>
          <div className="space-y-2">
            {draftsWithMedia.map((draft) => {
              const draftDate = new Date(draft.date);
              const channel = draft.channel as { name: string; id: string; typeId: string; type?: { id: string } } | undefined;
              const schedule = draft.schedule as { name: string; emoji: string | null; color: string | null } | null | undefined;
              const firstMedia = draft.postMedia?.[0]?.media;

              return (
                <Link
                  key={draft.id}
                  to="/posts/$postId"
                  params={{ postId: draft.id }}
                  className="flex items-center gap-3 rounded-lg border border-base-300 p-3 hover:bg-base-200 transition-colors"
                >
                  {firstMedia && (
                    <div className="w-16 h-16 flex-shrink-0">
                      <MediaTileLite media={firstMedia} hideTagStickers />
                    </div>
                  )}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-base font-semibold">
                      {format(draftDate, "EEE, MMM d")}
                    </span>
                    <span className="text-sm font-medium text-base-content/60">
                      {format(draftDate, "HH:mm")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {schedule && (
                      <ContentScheduleBadge
                        name={schedule.name}
                        emoji={schedule.emoji}
                        color={schedule.color}
                        size="sm"
                        borderStyle="none"
                        responsive={false}
                      />
                    )}
                    {channel && (
                      <ChannelBadge
                        name={channel.name}
                        typeId={channel.type?.id ?? channel.typeId}
                        size="sm"
                        borderStyle="none"
                        responsive={false}
                      />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
      {draftsWithoutMedia.length > 0 && (
        <div className="space-y-2 mt-4">
          <div className="flex items-center gap-2 text-base font-medium">
            <FileX className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <span>
              {draftsWithoutMedia.length} {draftsWithoutMedia.length === 1 ? "Draft" : "Drafts"} without media
            </span>
          </div>
          <div className="space-y-2">
            {draftsWithoutMedia.map((draft) => {
              const draftDate = new Date(draft.date);
              const channel = draft.channel as { name: string; id: string; typeId: string; type?: { id: string } } | undefined;
              const schedule = draft.schedule as { name: string; emoji: string | null; color: string | null } | null | undefined;

              return (
                <div
                  key={draft.id}
                  className="flex items-center gap-3 rounded-lg border border-base-300 p-3"
                >
                  <Button
                    size="icon"
                    variant="outline"
                    aria-label="Assign media"
                    onClick={() => onAssignMedia?.(draft.id)}
                    className="flex-shrink-0"
                  >
                    <ImagePlus className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-base font-semibold">
                      {format(draftDate, "EEE, MMM d")}
                    </span>
                    <span className="text-sm font-medium text-base-content/60">
                      {format(draftDate, "HH:mm")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {schedule && (
                      <ContentScheduleBadge
                        name={schedule.name}
                        emoji={schedule.emoji}
                        color={schedule.color}
                        size="sm"
                        borderStyle="none"
                        responsive={false}
                      />
                    )}
                    {channel && (
                      <ChannelBadge
                        name={channel.name}
                        typeId={channel.type?.id ?? channel.typeId}
                        size="sm"
                        borderStyle="none"
                        responsive={false}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
