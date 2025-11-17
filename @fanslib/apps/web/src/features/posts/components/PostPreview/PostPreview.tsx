import type { PostWithRelationsSchema } from "@fanslib/server/schemas";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { ChannelBadge } from "~/components/ChannelBadge";
import { MediaFilterSummary } from "~/components/MediaFilterSummary";
import { PostTagStickers } from "~/components/PostTagStickers";
import { StatusSticker } from "~/components/StatusSticker";
import { MediaSelectionProvider } from "~/contexts/MediaSelectionContext";
import { MediaTile } from "~/features/library/components/MediaTile";
import { cn } from "~/lib/cn";
import { isVirtualPost, type VirtualPost } from "~/lib/virtual-posts";
import { PostTimelineDropZone } from "../PostTimelineDropZone";
import { usePostPreviewDrag } from "./usePostPreviewDrag";

type Post = typeof PostWithRelationsSchema.static;

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
  });

  const previousDropZone =
    !isDraggedOver || !previousPostInList ? null : (
      <PostTimelineDropZone previousPostDate={new Date(previousPostInList.date)} />
    );
  const nextDropZone = !isDraggedOver ? null : (
    <PostTimelineDropZone previousPostDate={new Date(post.date)} />
  );

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
          "border rounded-md relative group transition-colors",
          isVirtualPost(post) && "opacity-60",
          isDragging &&
            isDraggedOver &&
            "border-2 border-dashed border-primary bg-primary/10 opacity-100"
        )}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <ChannelBadge name={post.channel.name} typeId={post.channel.type?.id ?? post.channel.typeId} />
              <StatusSticker status={post.status} />
              {isVirtualPost(post) ? (
                <MediaFilterSummary mediaFilters={post.mediaFilters} compact={true} />
              ) : (
                <PostTagStickers postMedia={post.postMedia ?? []} />
              )}
            </div>
            <span className="text-sm text-base-content/60 block">
              {format(new Date(post.date), "MMMM d, h:mm aaa")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isVirtualPost(post) && (
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

  return <div className="flex flex-col flex-1 min-h-0">{content}</div>;
};

