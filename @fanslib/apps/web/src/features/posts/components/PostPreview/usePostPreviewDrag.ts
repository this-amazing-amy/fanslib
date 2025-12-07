import type { CreatePostRequestBodySchema, MediaSchema, PostWithRelationsSchema } from "@fanslib/server/schemas";
import { useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useMediaDrag } from "~/contexts/MediaDragContext";
import { usePostPreferences } from "~/contexts/PostPreferencesContext";
import { useMediaListQuery } from "~/lib/queries/library";
import { useAddMediaToPostMutation, useCreatePostMutation } from "~/lib/queries/posts";
import { isVirtualPost, type VirtualPost } from "~/lib/virtual-posts";

type Post = typeof PostWithRelationsSchema.static;
type Media = typeof MediaSchema.static;

type CreatePostDialogData = {
  media: Media[];
  initialDate: Date;
  initialChannelId?: string;
  scheduleId?: string;
};

type UsePostPreviewDragProps = {
  post: Post | VirtualPost;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUpdate: () => Promise<void>;
  onOpenCreateDialog?: (data: CreatePostDialogData) => void;
};

export const usePostPreviewDrag = ({
  post,
  isOpen,
  onOpenChange,
  onUpdate,
  onOpenCreateDialog,
}: UsePostPreviewDragProps) => {
  const { refetch } = useMediaListQuery();
  const navigate = useNavigate();
  const { preferences } = usePostPreferences();
  const { draggedMedias, endMediaDrag, isDragging } = useMediaDrag();
  const wasClosedRef = useRef(false);
  const dragEnterCountRef = useRef(0);
  const [isDraggedOver, setIsDraggedOver] = useState(false);
  const createPostMutation = useCreatePostMutation();
  const addMediaMutation = useAddMediaToPostMutation();

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isDragging && draggedMedias.length > 0) {
      e.dataTransfer.dropEffect = "copy";
      setIsDraggedOver(true);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    if (isDragging && draggedMedias.length > 0) {
      const relatedTarget = e.relatedTarget as Node | null;
      if (!e.currentTarget.contains(relatedTarget)) {
        dragEnterCountRef.current++;
        if (dragEnterCountRef.current === 1) {
          wasClosedRef.current = !isOpen;
          onOpenChange(true);
          setIsDraggedOver(true);
        }
      }
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (isDragging && draggedMedias.length > 0) {
      const relatedTarget = e.relatedTarget as Node | null;
      if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
        dragEnterCountRef.current = 0;
        if (wasClosedRef.current) {
          onOpenChange(false);
        }
        setIsDraggedOver(false);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragEnterCountRef.current = 0;
    setIsDraggedOver(false);
    if (wasClosedRef.current) {
      onOpenChange(false);
    }

    if (!isDragging) return;

    try {
      if (isVirtualPost(post)) {
        const shouldOpenDialog = preferences.view.openDialogOnDrop && onOpenCreateDialog;

        if (shouldOpenDialog) {
          // Open create post dialog
          onOpenCreateDialog({
            media: draggedMedias,
            initialDate: new Date(post.date),
            initialChannelId: post.channelId,
            scheduleId: post.scheduleId,
          });
          endMediaDrag();
        } else {
          // Create post directly
          const createPostData: typeof CreatePostRequestBodySchema.static = {
            date: post.date,
            channelId: post.channelId,
            status: "draft",
            caption: "",
            mediaIds: draggedMedias.map((media) => media.id),
            scheduleId: post.scheduleId,
          };
          await createPostMutation.mutateAsync(createPostData);
          await onUpdate();
          endMediaDrag();
          refetch();
        }
        return;
      }

      await addMediaMutation.mutateAsync({
        id: post.id,
        mediaIds: draggedMedias.map((media) => media.id),
      });
      await onUpdate();
      endMediaDrag();
      refetch();
    } catch (error) {
      console.error("Failed to add media to post:", error);
    } finally {
      setIsDraggedOver(false);
      if (wasClosedRef.current) {
        onOpenChange(false);
      }
    }
  };

  return {
    isDragging,
    isDraggedOver,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  };
};

