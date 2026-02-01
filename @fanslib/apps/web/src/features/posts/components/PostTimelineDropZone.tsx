import type { Media, MediaSchema, PostWithRelations, PostWithRelationsSchema } from '@fanslib/server/schemas';
import { Plus } from "lucide-react";
import { useMediaDrag } from "~/contexts/MediaDragContext";
import { usePostDrag } from "~/contexts/PostDragContext";
import { useDragOver } from "~/hooks/useDragOver";
import { cn } from "~/lib/cn";
import { isVirtualPost, type VirtualPost } from "~/lib/virtual-posts";


type Post = PostWithRelations;

type CreatePostDialogData = {
  media: Media[];
  initialDate?: Date;
  initialChannelId?: string;
  initialCaption?: string;
  scheduleId?: string;
};

type PostTimelineDropZoneProps = {
  className?: string;
  previousPostDate: Date;
  dropTargetPost: Post | VirtualPost;
  onOpenCreateDialog: (data: CreatePostDialogData) => void;
};

export const PostTimelineDropZone = ({
  className,
  previousPostDate,
  dropTargetPost,
  onOpenCreateDialog,
}: PostTimelineDropZoneProps) => {
  const { isDragging: isMediaDragging, draggedMedias, endMediaDrag } = useMediaDrag();
  const { isDragging: isPostDragging, draggedPost, endPostDrag } = usePostDrag();

  const isDragging = isMediaDragging || isPostDragging;

  const getDraggedPostMedia = (post: Post): Media[] => post.postMedia.map((pm) => pm.media);
  const getDropTargetChannelId = (post: Post | VirtualPost): string =>
    isVirtualPost(post) ? post.channelId : post.channel.id;
  const getDropTargetScheduleId = (post: Post | VirtualPost): string | undefined =>
    isVirtualPost(post) ? post.scheduleId ?? undefined : post.schedule?.id ?? undefined;

  const { isOver, dragHandlers, setIsOver } = useDragOver({
    onDrop: async () => {
      const nextDate = new Date(previousPostDate);
      nextDate.setDate(nextDate.getDate() + 1);

      if (isMediaDragging && draggedMedias.length > 0) {
        onOpenCreateDialog({
          media: draggedMedias,
          initialDate: nextDate,
          initialChannelId: getDropTargetChannelId(dropTargetPost),
          scheduleId: getDropTargetScheduleId(dropTargetPost),
        });
        endMediaDrag();
        setIsOver(false);
        return;
      }

      if (isPostDragging && draggedPost) {
        onOpenCreateDialog({
          media: getDraggedPostMedia(draggedPost),
          initialCaption: draggedPost.caption ?? undefined,
          initialChannelId: getDropTargetChannelId(dropTargetPost),
          scheduleId: getDropTargetScheduleId(dropTargetPost),
          initialDate: nextDate,
        });
        endPostDrag();
        setIsOver(false);
      }
    },
  });

  if (!isDragging) {
    return null;
  }

  return (
    <div
      className={cn(
        "h-8 mx-4 rounded-lg border-2 border-dashed flex items-center justify-center transition-colors",
        isOver ? "border-primary bg-primary/10" : "border-base-300",
        className
      )}
      {...dragHandlers}
    >
      <Plus
        className={cn(
          "h-4 w-4 transition-colors",
          isOver ? "text-primary" : "text-base-content/60"
        )}
      />
    </div>
  );
};

