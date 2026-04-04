import type { Media, PostWithRelations } from "@fanslib/server/schemas";
import { Link } from "@tanstack/react-router";

import { isVirtualPost, type VirtualPost } from "~/lib/virtual-posts";
import { useVirtualPostClick } from "../../hooks/useVirtualPostClick";
import { PostTimelineDropZone } from "../PostTimelineDropZone";
import { PostPreviewCard } from "./PostPreviewCard";
import { usePostDropOnVirtualSlot } from "./usePostDropOnVirtualSlot";
import { usePostPreviewDrag } from "./usePostPreviewDrag";
import { useSkipSlotConfirmation } from "./useSkipSlotConfirmation";

type Post = PostWithRelations;

type CreatePostDialogData = {
  media: Media[];
  initialDate?: Date;
  initialChannelId?: string;
  scheduleId?: string;
  initialCaption?: string;
  initialMediaSelectionExpanded?: boolean;
};

type PostPreviewProps = {
  post: Post | VirtualPost;
  onUpdate: () => Promise<void>;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  previousPostInList?: Post | VirtualPost;
  nextPostInList?: Post | VirtualPost;
  onOpenCreateDialog: (data: CreatePostDialogData) => void;
  matchedPostMediaIds?: Set<string>;
};

export const PostPreview = ({
  post,
  onUpdate,
  isOpen,
  onOpenChange,
  previousPostInList,
  nextPostInList,
  onOpenCreateDialog,
  matchedPostMediaIds,
}: PostPreviewProps) => {
  const isVirtual = isVirtualPost(post);

  const { hasSkipConfirmation, skipScheduleSlot, resetSkipConfirmation, isSkipPending } =
    useSkipSlotConfirmation({
      post: isVirtual ? post : ({} as VirtualPost),
      onUpdate,
    });

  const virtualPostClick = useVirtualPostClick({
    post: isVirtual ? post : ({} as VirtualPost),
    onOpenCreateDialog: (data) => onOpenCreateDialog(data),
  });

  const {
    isDragging: isMediaDragging,
    isDraggedOver,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  } = usePostPreviewDrag({
    post,
    isOpen,
    onOpenChange,
    onUpdate,
    onOpenCreateDialog: (data) =>
      onOpenCreateDialog({ ...data, initialMediaSelectionExpanded: true }),
  });

  const {
    isPostDragging,
    isPostDraggedOver,
    setIsPostDraggedOver,
    dragProps,
    updatePostDraggedOver,
    onDropOnVirtualPost,
  } = usePostDropOnVirtualSlot({
    post,
    onUpdate,
    onOpenCreateDialog,
  });

  const isAnyDragging = isMediaDragging || isPostDragging;
  const isAnyDraggedOver =
    (isMediaDragging && isDraggedOver) || (isPostDragging && isPostDraggedOver);

  const shouldShowInsertionZones = isDraggedOver || isPostDragging;
  const isPreviousVirtual = previousPostInList ? isVirtualPost(previousPostInList) : false;
  const isNextVirtual = nextPostInList ? isVirtualPost(nextPostInList) : false;

  const previousDropZone =
    !shouldShowInsertionZones || !previousPostInList || isVirtual || isPreviousVirtual ? null : (
      <PostTimelineDropZone
        className="absolute left-4 right-4 top-2 z-20 mx-0"
        previousPostDate={new Date(previousPostInList.date)}
        dropTargetPost={previousPostInList}
        onOpenCreateDialog={onOpenCreateDialog}
      />
    );
  const nextDropZone = !shouldShowInsertionZones ? null : isVirtual || isNextVirtual ? null : (
    <PostTimelineDropZone
      className="absolute left-4 right-4 bottom-2 z-20 mx-0"
      previousPostDate={new Date(post.date)}
      dropTargetPost={post}
      onOpenCreateDialog={onOpenCreateDialog}
    />
  );

  const content = (
    <div
      {...dragProps}
      className="max-w-2xl"
      onDragOver={(e) => {
        handleDragOver(e);
        if (!isPostDragging) return;
        e.dataTransfer.dropEffect = "copy";
        setIsPostDraggedOver(true);
      }}
      onDragEnter={(e) => {
        handleDragEnter(e);
        updatePostDraggedOver(e, true);
      }}
      onDragLeave={(e) => {
        handleDragLeave(e);
        updatePostDraggedOver(e, false);
      }}
      onDrop={(e) => {
        if (onDropOnVirtualPost(e)) return;
        handleDrop(e);
      }}
    >
      <div className="relative">
        {previousDropZone}
        <PostPreviewCard
          post={post}
          isAnyDragging={isAnyDragging}
          isAnyDraggedOver={isAnyDraggedOver}
          hasSkipConfirmation={hasSkipConfirmation}
          isSkipPending={isSkipPending}
          onSkipScheduleSlot={skipScheduleSlot}
          onResetSkipConfirmation={resetSkipConfirmation}
          onVirtualPostClick={virtualPostClick.handleClick}
          matchedPostMediaIds={matchedPostMediaIds}
        />
        {nextDropZone}
      </div>
    </div>
  );

  const wrappedContent = isVirtual ? (
    <div className="flex flex-col flex-1 min-h-0">{content}</div>
  ) : (
    <Link to="/posts/$postId" params={{ postId: post.id }} className="flex flex-col flex-1 min-h-0">
      {content}
    </Link>
  );

  return wrappedContent;
};
