import type { MediaSchema, PostWithRelationsSchema } from "@fanslib/server/schemas";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { Camera, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { ChannelBadge } from "~/components/ChannelBadge";
import { ContentScheduleBadge } from "~/components/ContentScheduleBadge";
import { StatusIcon } from "~/components/StatusIcon";
import { MediaSelectionProvider } from "~/contexts/MediaSelectionContext";
import { usePostDrag } from "~/contexts/PostDragContext";
import { usePostPreferences } from "~/contexts/PostPreferencesContext";
import { CreatePostDialog } from "~/features/library/components/CreatePostDialog";
import { MediaTile } from "~/features/library/components/MediaTile";
import { cn } from "~/lib/cn";
import { useSkipScheduleSlotMutation } from "~/lib/queries/content-schedules";
import { isVirtualPost, type VirtualPost } from "~/lib/virtual-posts";
import { useCreatePostFromVirtualSlot } from "../../hooks/useCreatePostFromVirtualSlot";
import { useVirtualPostClick } from "../../hooks/useVirtualPostClick";
import { getCaptionPreview } from "../../lib/captions";
import { PostTimelineDropZone } from "../PostTimelineDropZone";
import { VirtualPostOverlay } from "../VirtualPostOverlay";
import { usePostPreviewDrag } from "./usePostPreviewDrag";

type Post = typeof PostWithRelationsSchema.static;
type Media = typeof MediaSchema.static;

type PostPreviewProps = {
  post: Post | VirtualPost;
  onUpdate: () => Promise<void>;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  previousPostInList?: Post | VirtualPost;
  nextPostInList?: Post | VirtualPost;
};

export const PostPreview = ({
  post,
  onUpdate,
  isOpen,
  onOpenChange,
  previousPostInList,
  nextPostInList,
}: PostPreviewProps) => {
  const isVirtual = isVirtualPost(post);
  const { preferences } = usePostPreferences();
  const { createPostFromVirtualSlot } = useCreatePostFromVirtualSlot();
  const { startPostDrag, endPostDrag: stopPostDrag, isDragging: isPostDragging, draggedPost } = usePostDrag();
  const [createPostData, setCreatePostData] = useState<{
    media: Media[];
    initialDate?: Date;
    initialChannelId?: string;
    scheduleId?: string;
    initialCaption?: string;
    initialMediaSelectionExpanded?: boolean;
  } | null>(null);
  const [hasSkipConfirmation, setHasSkipConfirmation] = useState(false);
  const skipSlotMutation = useSkipScheduleSlotMutation();
  const captionPreview = post.caption ? getCaptionPreview(post.caption) : "";

  const virtualPostClick = useVirtualPostClick({
    post: isVirtual ? post : ({} as VirtualPost),
    onOpenCreateDialog: (data) => setCreatePostData(data),
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
    onOpenCreateDialog: (data) => setCreatePostData({ ...data, initialMediaSelectionExpanded: true }),
  });

  const dragProps = isVirtual
    ? {}
    : {
        draggable: true,
        onDragStart: (e: React.DragEvent<HTMLDivElement>) => startPostDrag(e, post),
        onDragEnd: stopPostDrag,
      };

  const [isPostDraggedOver, setIsPostDraggedOver] = useState(false);
  const isAnyDragging = isMediaDragging || isPostDragging;
  const isAnyDraggedOver = (isMediaDragging && isDraggedOver) || (isPostDragging && isPostDraggedOver);

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
    const scheduleId = post.scheduleId;

    if (preferences.view.openDialogOnDrop) {
      setCreatePostData({
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

  const closeCreatePostDialog = () => {
    setCreatePostData(null);
    onUpdate();
  };

  const skipScheduleSlot = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isVirtual) {
      return;
    }

    if (!hasSkipConfirmation) {
      setHasSkipConfirmation(true);
      return;
    }

    await skipSlotMutation.mutateAsync({
      scheduleId: post.scheduleId,
      date: post.date,
    });

    await onUpdate();
    setHasSkipConfirmation(false);
  };

  const shouldShowInsertionZones = isDraggedOver || isPostDragging;
  const isPreviousVirtual = previousPostInList ? isVirtualPost(previousPostInList) : false;
  const isNextVirtual = nextPostInList ? isVirtualPost(nextPostInList) : false;

  const previousDropZone =
    !shouldShowInsertionZones || !previousPostInList || isVirtual || isPreviousVirtual ? null : (
      <PostTimelineDropZone
        className="absolute left-4 right-4 top-2 z-20 mx-0"
        previousPostDate={new Date(previousPostInList.date)}
        dropTargetPost={previousPostInList}
      />
    );
  const nextDropZone = !shouldShowInsertionZones ? null : (
    isVirtual || isNextVirtual ? null : (
      <PostTimelineDropZone
        className="absolute left-4 right-4 bottom-2 z-20 mx-0"
        previousPostDate={new Date(post.date)}
        dropTargetPost={post}
      />
    )
  );

  const status = post.status ?? 'draft';

  const content = (
    <div
      {...dragProps}
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
        <div
          className={cn(
            "border border-base-content rounded-xl relative group transition-all bg-base-100",
            isVirtual && "opacity-60",
            isAnyDragging &&
              isAnyDraggedOver &&
              "border-2 border-dashed border-primary bg-primary/10 opacity-100"
          )}
          onMouseLeave={() => setHasSkipConfirmation(false)}
        >
          {isVirtual && !isAnyDragging && (
            <VirtualPostOverlay onClick={virtualPostClick.handleClick} />
          )}

          {isVirtual && !isAnyDragging && (
            <button
              type="button"
              onClick={skipScheduleSlot}
              disabled={skipSlotMutation.isPending}
              className={cn(
                "absolute top-2 right-2 p-1 rounded-md transition-all",
                "opacity-0 group-hover:opacity-100",
                "z-10",
                hasSkipConfirmation
                  ? "bg-error/80 hover:bg-error text-error-content"
                  : "bg-base-200/80 hover:bg-base-300 text-base-content/60 hover:text-base-content",
                skipSlotMutation.isPending && "opacity-60 cursor-not-allowed"
              )}
              title={
                skipSlotMutation.isPending
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
                  <StatusIcon status={status as 'posted' | 'scheduled' | 'draft'} />
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
                    name={post.schedule.name}
                    emoji={post.schedule.emoji}
                    color={post.schedule.color}
                    size="sm"
                    selected
                    borderStyle="none"
                    className="justify-center"
                    responsive={false}
                  />
                ) : post.schedule && (
                  <ContentScheduleBadge
                    name={post.schedule.name}
                    emoji={post.schedule.emoji}
                    color={post.schedule.color}
                    size="sm"
                    selected
                    borderStyle="none"
                    className="justify-center"
                    responsive={false}
                  />
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isVirtual ? (
                <div className="w-24 h-24 rounded-md border-2 border-dashed border-base-300 bg-base-200/30 flex flex-col items-center justify-center">
                  <Camera className="w-6 h-6 text-base-content/20" />
                </div>
              ) : (
                <MediaSelectionProvider media={post.postMedia.map((pm) => pm.media)}>
                  {post.postMedia.map((pm) => (
                    <MediaTile
                      key={pm.id}
                      media={pm.media}
                      allMedias={post.postMedia.map((pm) => pm.media)}
                      index={post.postMedia.indexOf(pm)}
                      className="size-24"
                      withPreview
                      withDuration
                    />
                  ))}
                </MediaSelectionProvider>
              )}
            </div>
          </div>
          {isAnyDragging && isAnyDraggedOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
              <Plus className="w-6 h-6 text-primary" />
            </div>
          )}
        </div>
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

  return (
    <>
      {wrappedContent}
      <CreatePostDialog
        open={createPostData !== null}
        onOpenChange={closeCreatePostDialog}
        media={createPostData?.media ?? []}
        initialDate={createPostData?.initialDate}
        initialChannelId={createPostData?.initialChannelId}
        scheduleId={createPostData?.scheduleId}
        initialCaption={createPostData?.initialCaption}
        initialMediaSelectionExpanded={createPostData?.initialMediaSelectionExpanded}
      />
    </>
  );
};

