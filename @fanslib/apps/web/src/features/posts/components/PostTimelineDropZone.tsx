import type { MediaSchema, PostWithRelationsSchema } from "@fanslib/server/schemas";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useMediaDrag } from "~/contexts/MediaDragContext";
import { usePostDrag } from "~/contexts/PostDragContext";
import { CreatePostDialog } from "~/features/library/components/CreatePostDialog";
import { useDragOver } from "~/hooks/useDragOver";
import { cn } from "~/lib/cn";
import { isVirtualPost, type VirtualPost } from "~/lib/virtual-posts";

type Media = typeof MediaSchema.static;
type Post = typeof PostWithRelationsSchema.static;

type PostTimelineDropZoneProps = {
  className?: string;
  previousPostDate: Date;
  dropTargetPost: Post | VirtualPost;
};

export const PostTimelineDropZone = ({
  className,
  previousPostDate,
  dropTargetPost,
}: PostTimelineDropZoneProps) => {
  const { isDragging: isMediaDragging, draggedMedias, endMediaDrag } = useMediaDrag();
  const { isDragging: isPostDragging, draggedPost, endPostDrag } = usePostDrag();
  const [createPostData, setCreatePostData] = useState<{
    media: Media[];
    initialDate?: Date;
    initialChannelId?: string;
    initialCaption?: string;
    scheduleId?: string;
  } | null>(null);

  const isDragging = isMediaDragging || isPostDragging;

  const getDraggedPostMedia = (post: Post): Media[] => post.postMedia.map((pm) => pm.media);
  const getDropTargetChannelId = (post: Post | VirtualPost): string =>
    isVirtualPost(post) ? post.channelId : post.channel.id;
  const getDropTargetScheduleId = (post: Post | VirtualPost): string | undefined =>
    isVirtualPost(post) ? post.scheduleId : post.schedule?.id ?? undefined;

  const { isOver, dragHandlers, setIsOver } = useDragOver({
    onDrop: async () => {
      const nextDate = new Date(previousPostDate);
      nextDate.setDate(nextDate.getDate() + 1);

      if (isMediaDragging && draggedMedias.length > 0) {
        setCreatePostData({
          media: draggedMedias,
          initialDate: nextDate,
          initialChannelId: getDropTargetChannelId(dropTargetPost),
          scheduleId: getDropTargetScheduleId(dropTargetPost),
        });
        endMediaDrag();
        return;
      }

      if (isPostDragging && draggedPost) {
        setCreatePostData({
          media: getDraggedPostMedia(draggedPost),
          initialCaption: draggedPost.caption ?? undefined,
          initialChannelId: getDropTargetChannelId(dropTargetPost),
          scheduleId: getDropTargetScheduleId(dropTargetPost),
          initialDate: nextDate,
        });
        endPostDrag();
      }
    },
  });

  const handleClose = () => {
    setCreatePostData(null);
    setIsOver(false);
  };

  if (!isDragging && createPostData === null) {
    return null;
  }

  return (
    <>
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

      <CreatePostDialog
        open={createPostData !== null}
        onOpenChange={handleClose}
        media={createPostData?.media ?? []}
        initialDate={createPostData?.initialDate}
        initialChannelId={createPostData?.initialChannelId}
        initialCaption={createPostData?.initialCaption}
        scheduleId={createPostData?.scheduleId}
      />
    </>
  );
};

