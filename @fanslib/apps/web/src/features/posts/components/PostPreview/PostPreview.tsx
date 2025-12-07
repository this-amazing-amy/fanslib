import type { MediaSchema, PostWithRelationsSchema } from "@fanslib/server/schemas";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { Camera, Plus } from "lucide-react";
import { useState } from "react";
import { ChannelBadge } from "~/components/ChannelBadge";
import { ContentScheduleBadge } from "~/components/ContentScheduleBadge";
import { MediaFilterSummary } from "~/components/MediaFilterSummary";
import { StatusIcon } from "~/components/StatusIcon";
import { MediaSelectionProvider } from "~/contexts/MediaSelectionContext";
import { CreatePostDialog } from "~/features/library/components/CreatePostDialog";
import { MediaTile } from "~/features/library/components/MediaTile";
import { cn } from "~/lib/cn";
import { getPostStatusBorderColor } from "~/lib/colors";
import { isVirtualPost, type VirtualPost } from "~/lib/virtual-posts";
import { PostTimelineDropZone } from "../PostTimelineDropZone";
import { usePostPreviewDrag } from "./usePostPreviewDrag";

type Post = typeof PostWithRelationsSchema.static;
type Media = typeof MediaSchema.static;

type PostPreviewProps = {
  post: Post | VirtualPost;
  onUpdate: () => Promise<void>;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  previousPostInList?: Post | VirtualPost;
};

export const PostPreview = ({
  post,
  onUpdate,
  isOpen,
  onOpenChange,
  previousPostInList,
}: PostPreviewProps) => {
  const [createPostData, setCreatePostData] = useState<{
    media: Media[];
    initialDate?: Date;
    initialChannelId?: string;
    scheduleId?: string;
  } | null>(null);

  const {
    isDragging,
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
    onOpenCreateDialog: (data) => setCreatePostData(data),
  });

  const closeCreatePostDialog = () => {
    setCreatePostData(null);
    onUpdate();
  };

  const previousDropZone =
    !isDraggedOver || !previousPostInList ? null : (
      <PostTimelineDropZone previousPostDate={new Date(previousPostInList.date)} />
    );
  const nextDropZone = !isDraggedOver ? null : (
    <PostTimelineDropZone previousPostDate={new Date(post.date)} />
  );

  const status = post.status ?? 'draft';
  const borderColor = getPostStatusBorderColor(status as 'posted' | 'scheduled' | 'draft');

  const content = (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {previousDropZone}
      <div
        className={cn(
          "border-2 rounded-xl relative group transition-all bg-base-100",
          isVirtualPost(post) && "opacity-60",
          isDragging &&
            isDraggedOver &&
            "border-2 border-dashed border-primary bg-primary/10 opacity-100"
        )}
        style={{
          borderColor: isDragging && isDraggedOver ? undefined : borderColor,
        }}
      >
        <div className="flex items-start justify-between p-4 gap-4">
          <div className="flex flex-col gap-2 flex-1">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-base font-semibold text-base-content">
                  {format(new Date(post.date), "MMMM d")}
                </span>
                <span className="text-sm font-medium text-base-content/60">
                  {format(new Date(post.date), "HH:mm")}
                </span>
              </div>
              <StatusIcon status={status as 'posted' | 'scheduled' | 'draft'} />
            </div>
            <div className="flex items-center gap-2">
              <ChannelBadge name={post.channel.name} typeId={post.channel.type?.id ?? post.channel.typeId} size="md" />
              {isVirtualPost(post) ? (
                <ContentScheduleBadge
                  name={post.schedule.name}
                  emoji={post.schedule.emoji}
                  color={post.schedule.color}
                  size="md"
                />
              ) : post.schedule && (
                <ContentScheduleBadge
                  name={post.schedule.name}
                  emoji={post.schedule.emoji}
                  color={post.schedule.color}
                  size="md"
                />
              )}
              {isVirtualPost(post) && (
                <MediaFilterSummary mediaFilters={post.mediaFilters} />
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isVirtualPost(post) ? (
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
                  />
                ))}
              </MediaSelectionProvider>
            )}
          </div>
        </div>
        {isDragging && isDraggedOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
            <Plus className="w-6 h-6 text-primary" />
          </div>
        )}
      </div>
      {nextDropZone}
    </div>
  );

  const wrappedContent = isVirtualPost(post) ? (
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
      />
    </>
  );
};

