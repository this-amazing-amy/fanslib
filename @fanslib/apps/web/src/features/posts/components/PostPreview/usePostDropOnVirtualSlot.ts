import type { Media, PostWithRelations } from "@fanslib/server/schemas";
import { useState } from "react";
import { usePostDrag } from "~/contexts/PostDragContext";
import { usePostPreferences } from "~/contexts/PostPreferencesContext";
import { isVirtualPost, type VirtualPost } from "~/lib/virtual-posts";
import { useCreatePostFromVirtualSlot } from "../../hooks/useCreatePostFromVirtualSlot";

type CreatePostDialogData = {
  media: Media[];
  initialDate?: Date;
  initialChannelId?: string;
  scheduleId?: string;
  initialCaption?: string;
  initialMediaSelectionExpanded?: boolean;
};

type UsePostDropOnVirtualSlotProps = {
  post: PostWithRelations | VirtualPost;
  onUpdate: () => Promise<void>;
  onOpenCreateDialog: (data: CreatePostDialogData) => void;
};

export const usePostDropOnVirtualSlot = ({
  post,
  onUpdate,
  onOpenCreateDialog,
}: UsePostDropOnVirtualSlotProps) => {
  const { preferences } = usePostPreferences();
  const { createPostFromVirtualSlot } = useCreatePostFromVirtualSlot();
  const {
    startPostDrag,
    endPostDrag: stopPostDrag,
    isDragging: isPostDragging,
    draggedPost,
  } = usePostDrag();

  const isVirtual = isVirtualPost(post);
  const [isPostDraggedOver, setIsPostDraggedOver] = useState(false);

  const dragProps = isVirtual
    ? {}
    : {
        draggable: true as const,
        onDragStart: (e: React.DragEvent<HTMLDivElement>) => startPostDrag(e, post),
        onDragEnd: stopPostDrag,
      };

  const updatePostDraggedOver = (e: React.DragEvent<HTMLDivElement>, nextValue: boolean) => {
    if (!isPostDragging) return;
    const relatedTarget = e.relatedTarget as Node | null;
    if (relatedTarget && e.currentTarget.contains(relatedTarget)) return;
    setIsPostDraggedOver(nextValue);
  };

  const onDropOnVirtualPost = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isPostDragging || !draggedPost || !isVirtualPost(post)) return false;
    e.preventDefault();
    e.stopPropagation();

    setIsPostDraggedOver(false);
    const media = draggedPost.postMedia.map((pm) => pm.media);
    const caption = draggedPost.caption ?? undefined;
    const initialDate = new Date(post.date);
    const initialChannelId = post.channelId;
    const scheduleId = post.scheduleId ?? undefined;

    if (preferences.view.openDialogOnDrop) {
      onOpenCreateDialog({
        media,
        initialCaption: caption,
        initialDate,
        initialChannelId,
        scheduleId,
      });
      stopPostDrag();
      return true;
    }

    stopPostDrag();
    void createPostFromVirtualSlot({
      virtualPost: post,
      mediaIds: media.map((m) => m.id),
      caption,
      onUpdate,
    });
    return true;
  };

  return {
    isPostDragging,
    isPostDraggedOver,
    setIsPostDraggedOver,
    dragProps,
    updatePostDraggedOver,
    onDropOnVirtualPost,
    stopPostDrag,
  };
};
