import { Plus } from "lucide-react";
import { useState } from "react";
import { MediaSchema, PostWithRelationsSchema } from "@fanslib/server/schemas";
import { useMediaDrag } from "~/contexts/MediaDragContext";

type Media = typeof MediaSchema.static;
type Post = typeof PostWithRelationsSchema.static;
import { usePostDrag } from "~/contexts/PostDragContext";
import { useAddMediaToPostMutation } from "~/lib/queries/posts";
import { useDragOver } from "~/hooks/useDragOver";
import { cn } from "~/lib/cn";
import { CreatePostDialog } from "~/features/library/components/CreatePostDialog";
import { isVirtualPost, type VirtualPost } from "~/lib/virtual-posts";

type PostCalendarDropzoneProps = {
  post: Post | VirtualPost;
  onUpdate?: () => Promise<void>;
  children: React.ReactNode;
};

export const PostCalendarDropzone = ({ post, children, onUpdate }: PostCalendarDropzoneProps) => {
  const { isDragging: isMediaDragging, draggedMedias, endMediaDrag } = useMediaDrag();
  const { isDragging: isPostDragging, draggedPost, endPostDrag } = usePostDrag();
  const [createPostData, setCreatePostData] = useState<{
    media: Media[];
    caption?: string;
  } | null>(null);
  const addMediaMutation = useAddMediaToPostMutation();

  const isDragging = isMediaDragging || isPostDragging;

  const { isOver, dragHandlers } = useDragOver({
    onDrop: async () => {
      if (!isVirtualPost(post)) {
        if (isMediaDragging && draggedMedias.length > 0) {
          try {
            await addMediaMutation.mutateAsync({
              id: post.id,
              mediaIds: draggedMedias.map((media) => media.id),
            });
            await onUpdate?.();
          } catch (error) {
            console.error("Failed to add media to post:", error);
          }
          endMediaDrag();
        }
        return;
      }

      if (isMediaDragging && draggedMedias.length > 0) {
        setCreatePostData({ media: draggedMedias });
        endMediaDrag();
      } else if (isPostDragging && draggedPost && isVirtualPost(post)) {
        setCreatePostData({
          media: !isVirtualPost(draggedPost) && draggedPost.postMedia ? draggedPost.postMedia.map((pm) => pm.media) : [],
          caption: draggedPost.caption ?? undefined,
        });
        endPostDrag();
      }
    },
  });

  const closeCreatePostDialog = () => {
    setCreatePostData(null);
    onUpdate?.();
  };

  return (
    <>
      <div
        {...dragHandlers}
        className={cn("relative group", {
          "after:absolute after:inset-0 after:rounded-md after:border-2 after:border-dashed after:pointer-events-none":
            isDragging,
          "after:border-primary after:bg-primary/10": isOver && isDragging,
          "after:border-base-300 after:bg-base-300/40": isDragging && !isOver,
        })}
      >
        {children}
        {isDragging && (
          <Plus
            className={cn(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 transition-colors pointer-events-none",
              "text-primary"
            )}
          />
        )}
      </div>
      <CreatePostDialog
        open={createPostData !== null}
        onOpenChange={closeCreatePostDialog}
        media={createPostData?.media ?? []}
      />
    </>
  );
};

