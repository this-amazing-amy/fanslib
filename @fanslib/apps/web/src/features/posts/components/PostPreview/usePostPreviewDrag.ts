import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { Post } from "@fanslib/types";
import { useMediaDrag } from "~/contexts/MediaDragContext";
import { useCreatePostMutation, useAddMediaToPostMutation } from "~/lib/queries/posts";
import { useMediaListQuery } from "~/lib/queries/library";
import { isVirtualPost, type VirtualPost } from "~/lib/virtual-posts";

type UsePostPreviewDragProps = {
  post: Post | VirtualPost;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUpdate: () => Promise<void>;
};

export const usePostPreviewDrag = ({
  post,
  isOpen,
  onOpenChange,
  onUpdate,
}: UsePostPreviewDragProps) => {
  const { refetch } = useMediaListQuery();
  const navigate = useNavigate();
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
        const newPost = await createPostMutation.mutateAsync({
          date: post.date,
          channelId: post.channelId,
          status: "draft",
          caption: "",
          mediaIds: draggedMedias.map((media) => media.id),
        } as any);
        await onUpdate();
        endMediaDrag();
        refetch();

        navigate({ to: "/posts/$postId", params: { postId: newPost.id } });
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

