import type { CreatePostRequestBodySchema, MediaSchema, PostWithRelationsSchema } from "@fanslib/server/schemas";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useMediaDrag } from "~/contexts/MediaDragContext";
import { usePostDrag } from "~/contexts/PostDragContext";
import { usePostPreferences } from "~/contexts/PostPreferencesContext";
import { CreatePostDialog } from "~/features/library/components/CreatePostDialog";
import { useDragOver } from "~/hooks/useDragOver";
import { cn } from "~/lib/cn";
import { useAddMediaToPostMutation, useCreatePostMutation } from "~/lib/queries/posts";
import { isVirtualPost, type VirtualPost } from "~/lib/virtual-posts";

type Media = typeof MediaSchema.static;
type Post = typeof PostWithRelationsSchema.static;

type PostCalendarDropzoneProps = {
  post: Post | VirtualPost;
  onUpdate?: () => Promise<void>;
  children: React.ReactNode;
};

export const PostCalendarDropzone = ({ post, children, onUpdate }: PostCalendarDropzoneProps) => {
  const { isDragging: isMediaDragging, draggedMedias, endMediaDrag } = useMediaDrag();
  const { isDragging: isPostDragging, draggedPost, endPostDrag } = usePostDrag();
  const { preferences } = usePostPreferences();
  const [createPostData, setCreatePostData] = useState<{
    media: Media[];
    caption?: string;
    scheduleId?: string;
    initialDate?: Date;
  } | null>(null);
  const addMediaMutation = useAddMediaToPostMutation();
  const createPostMutation = useCreatePostMutation();

  const isDragging = isMediaDragging || isPostDragging;

  const createPostDirectly = async (mediaIds: string[], scheduleId?: string, caption?: string) => {
    if (!isVirtualPost(post)) return;

    const createData: typeof CreatePostRequestBodySchema.static = {
      date: post.date,
      channelId: post.channelId,
      status: "draft",
      caption: caption ?? "",
      mediaIds,
      scheduleId,
    };
    await createPostMutation.mutateAsync(createData);
    await onUpdate?.();
  };

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
        if (preferences.view.openDialogOnDrop) {
          setCreatePostData({
            media: draggedMedias,
            scheduleId: post.scheduleId,
            initialDate: new Date(post.date),
          });
        } else {
          await createPostDirectly(
            draggedMedias.map((m) => m.id),
            post.scheduleId
          );
        }
        endMediaDrag();
      } else if (isPostDragging && draggedPost && isVirtualPost(post)) {
        const media = !isVirtualPost(draggedPost) && draggedPost.postMedia
          ? draggedPost.postMedia.map((pm) => pm.media)
          : [];

        if (preferences.view.openDialogOnDrop) {
          setCreatePostData({
            media,
            caption: draggedPost.caption ?? undefined,
            scheduleId: post.scheduleId,
            initialDate: new Date(post.date),
          });
        } else {
          await createPostDirectly(
            media.map((m) => m.id),
            post.scheduleId,
            draggedPost.caption ?? undefined
          );
        }
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
        scheduleId={createPostData?.scheduleId}
        initialDate={createPostData?.initialDate}
      />
    </>
  );
};

