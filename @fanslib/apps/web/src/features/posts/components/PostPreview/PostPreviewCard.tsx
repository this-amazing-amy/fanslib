import type { PostWithRelations } from "@fanslib/server/schemas";
import { format } from "date-fns";
import { Camera, Plus, Trash2, X } from "lucide-react";
import { ChannelBadge } from "~/components/ChannelBadge";
import { ContentScheduleBadge } from "~/components/ContentScheduleBadge";
import { StatusIcon } from "~/components/StatusIcon";
import { usePostPreferences } from "~/contexts/PostPreferencesContext";
import { MediaTile } from "~/features/library/components/MediaTile";
import { cn } from "~/lib/cn";
import { isVirtualPost, type VirtualPost } from "~/lib/virtual-posts";
import { getCaptionPreview } from "../../lib/captions";
import { VirtualPostOverlay } from "../VirtualPostOverlay";

type PostPreviewCardProps = {
  post: PostWithRelations | VirtualPost;
  isAnyDragging: boolean;
  isAnyDraggedOver: boolean;
  hasSkipConfirmation: boolean;
  isSkipPending: boolean;
  onSkipScheduleSlot: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onResetSkipConfirmation: () => void;
  onVirtualPostClick: () => void;
  matchedPostMediaIds?: Set<string>;
};

export const PostPreviewCard = ({
  post,
  isAnyDragging,
  isAnyDraggedOver,
  hasSkipConfirmation,
  isSkipPending,
  onSkipScheduleSlot,
  onResetSkipConfirmation,
  onVirtualPostClick,
  matchedPostMediaIds,
}: PostPreviewCardProps) => {
  const isVirtual = isVirtualPost(post);
  const { preferences } = usePostPreferences();
  const captionPreview = post.caption ? getCaptionPreview(post.caption) : "";
  const status = post.status ?? "draft";

  return (
    <div
      className={cn(
        "border border-base-content rounded-xl relative group transition-all bg-base-100",
        isVirtual && "opacity-60",
        isAnyDragging &&
          isAnyDraggedOver &&
          "border-2 border-dashed border-primary bg-primary/10 opacity-100",
      )}
      onMouseLeave={onResetSkipConfirmation}
    >
      {isVirtual && !isAnyDragging && (
        <VirtualPostOverlay onClick={onVirtualPostClick} />
      )}

      {isVirtual && !isAnyDragging && (
        <button
          type="button"
          onClick={onSkipScheduleSlot}
          disabled={isSkipPending}
          className={cn(
            "absolute top-2 right-2 p-1 rounded-md transition-all",
            "opacity-0 group-hover:opacity-100",
            "z-10",
            hasSkipConfirmation
              ? "bg-error/80 hover:bg-error text-error-content"
              : "bg-base-200/80 hover:bg-base-300 text-base-content/60 hover:text-base-content",
            isSkipPending && "opacity-60 cursor-not-allowed",
          )}
          title={
            isSkipPending
              ? "Skipping..."
              : hasSkipConfirmation
                ? "Click again to confirm skip"
                : "Skip this slot"
          }
        >
          {hasSkipConfirmation ? <Trash2 size={14} /> : <X size={14} />}
        </button>
      )}

      <div className="flex items-stretch justify-between p-4 gap-4">
        <div className="flex flex-col justify-between gap-2 flex-1">
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <div className="mt-1">
                <StatusIcon status={status as "posted" | "scheduled" | "draft"} />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-semibold text-base-content">
                  {format(new Date(post.date), "MMMM d")}
                </span>
                <span className="text-sm font-medium text-base-content/60">
                  {format(new Date(post.date), "HH:mm")}
                </span>
              </div>
            </div>
            {preferences.view.showCaptions && captionPreview && (
              <div className="text-sm leading-snug text-base-content line-clamp-2">
                {captionPreview}
              </div>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <ChannelBadge
              name={post.channel.name}
              typeId={post.channel.type?.id ?? post.channel.typeId}
              size="sm"
              selected
              borderStyle="none"
              className="justify-center"
              responsive={false}
            />
            {isVirtual ? (
              <ContentScheduleBadge
                name={post.schedule?.name ?? ""}
                emoji={post.schedule?.emoji ?? undefined}
                color={post.schedule?.color ?? undefined}
                size="sm"
                selected
                borderStyle="none"
                className="justify-center"
                responsive={false}
              />
            ) : post.schedule ? (
              <ContentScheduleBadge
                name={post.schedule.name}
                emoji={post.schedule.emoji ?? undefined}
                color={post.schedule.color ?? undefined}
                size="sm"
                selected
                borderStyle="none"
                className="justify-center"
                responsive={false}
              />
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isVirtual ? (
            <div className="w-24 h-24 rounded-md border-2 border-dashed border-base-300 bg-base-200/30 flex flex-col items-center justify-center">
              <Camera className="w-6 h-6 text-base-content/20" />
            </div>
          ) : (
            post.postMedia.map((pm) => {
              const isMatched = matchedPostMediaIds?.has(pm.id) ?? false;
              return (
                <MediaTile
                  key={pm.id}
                  media={pm.media}
                  index={post.postMedia.indexOf(pm)}
                  className={cn("size-24", isMatched && "opacity-30")}
                  withPreview
                  withDuration
                />
              );
            })
          )}
        </div>
      </div>
      {isAnyDragging && isAnyDraggedOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
          <Plus className="w-6 h-6 text-primary" />
        </div>
      )}
    </div>
  );
};
