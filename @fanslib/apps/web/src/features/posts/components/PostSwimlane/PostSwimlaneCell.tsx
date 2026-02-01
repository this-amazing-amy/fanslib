import { Plus } from "lucide-react";
import type { Media, PostWithRelations } from '@fanslib/server/schemas';
import { useMediaDrag } from "~/contexts/MediaDragContext";
import { usePostDrag } from "~/contexts/PostDragContext";
import { useDragOver } from "~/hooks/useDragOver";
import { cn } from "~/lib/cn";
import { isVirtualPost, type VirtualPost } from "~/lib/virtual-posts";
import { useCreatePostDialog } from "./CreatePostDialogContext";
import { PostSwimlaneCard } from "./PostSwimlaneCard";


type Post = PostWithRelations;

type PostSwimlaneCellProps = {
  date: Date;
  channelId: string;
  posts: (Post | VirtualPost)[];
};

export const PostSwimlaneCell = ({
  date,
  channelId,
  posts,
}: PostSwimlaneCellProps) => {
  const { isDragging: isMediaDragging, draggedMedias, endMediaDrag } = useMediaDrag();
  const { isDragging: isPostDragging, draggedPost, endPostDrag } = usePostDrag();
  const { openCreatePostDialog } = useCreatePostDialog();

  const isDragging = isMediaDragging || isPostDragging;

  const getDraggedPostMedia = (post: Post): Media[] => post.postMedia.map((pm) => pm.media);

  const { isOver, dragHandlers } = useDragOver({
    onDrop: async () => {
      if (isMediaDragging && draggedMedias.length > 0) {
        openCreatePostDialog({
          media: draggedMedias,
          initialDate: date,
          initialChannelId: channelId,
        });
        endMediaDrag();
        return;
      }

      if (isPostDragging && draggedPost) {
        openCreatePostDialog({
          media: getDraggedPostMedia(draggedPost),
          initialCaption: draggedPost.caption ?? undefined,
          initialChannelId: channelId,
          initialDate: date,
          scheduleId: isVirtualPost(draggedPost) ? draggedPost.scheduleId ?? undefined : draggedPost.schedule?.id,
        });
        endPostDrag();
      }
    },
  });

  const openEmptyDialog = () => {
    openCreatePostDialog({
      media: [],
      initialDate: date,
      initialChannelId: channelId,
    });
  };

  const sortedPosts = [...posts].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  if (sortedPosts.length === 0) {
    return (
      <div
        {...dragHandlers}
        onClick={openEmptyDialog}
        className={cn(
          "h-full min-h-[80px] border border-dashed rounded-lg",
          "flex items-center justify-center",
          "transition-colors cursor-pointer",
          isOver
            ? "border-primary bg-primary/10"
            : "border-base-300 hover:border-primary/50 hover:bg-primary/5"
        )}
      >
        <Plus
          className={cn(
            "w-4 h-4 transition-colors",
            isOver ? "text-primary" : "text-base-content/30"
          )}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 min-h-[80px]">
      {sortedPosts.map((post) => (
        <PostSwimlaneCard key={post.id} post={post} />
      ))}
      {isDragging && (
        <div
          {...dragHandlers}
          className={cn(
            "h-8 border border-dashed rounded-lg flex items-center justify-center transition-colors",
            isOver ? "border-primary bg-primary/10" : "border-base-300"
          )}
        >
          <Plus
            className={cn(
              "w-3 h-3 transition-colors",
              isOver ? "text-primary" : "text-base-content/30"
            )}
          />
        </div>
      )}
    </div>
  );
};


