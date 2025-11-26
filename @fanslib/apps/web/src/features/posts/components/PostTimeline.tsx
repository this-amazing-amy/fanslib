import type { MediaSchema, PostWithRelationsSchema } from "@fanslib/server/schemas";
import { CalendarDays } from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "~/components/ui/ScrollArea";
import { useMediaDrag } from "~/contexts/MediaDragContext";
import { CreatePostDialog } from "~/features/library/components/CreatePostDialog";
import { useDragOver } from "~/hooks/useDragOver";
import { cn } from "~/lib/cn";
import { isVirtualPost, type VirtualPost } from "~/lib/virtual-posts";
import { PostPreview } from "./PostPreview/PostPreview";
import { usePostTimelineVirtualizer } from "./usePostTimelineVirtualizer";

type Media = typeof MediaSchema.static;
type Post = typeof PostWithRelationsSchema.static;
type TimelineVirtualizer = ReturnType<typeof usePostTimelineVirtualizer>["virtualizer"];
type TimelineVirtualItem = ReturnType<TimelineVirtualizer["getVirtualItems"]>[number];

type PostTimelineProps = {
  posts: (Post | VirtualPost)[];
  className?: string;
  onUpdate: () => Promise<void>;
};

export const PostTimeline = ({ posts, className, onUpdate }: PostTimelineProps) => {
  const [openPostId, setOpenPostId] = useState<string | null>(null);
  const { isDragging, draggedMedias, endMediaDrag } = useMediaDrag();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [droppedMedias, setDroppedMedias] = useState<Media[]>([]);

  const { isOver, dragHandlers } = useDragOver({
    onDrop: async () => {
      if (draggedMedias.length === 0) return;
      setDroppedMedias(draggedMedias);
      setIsDialogOpen(true);
      endMediaDrag();
    },
  });

  const handleClose = () => {
    setIsDialogOpen(false);
    onUpdate();
  };

  const sortedPosts = [...posts].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const { scrollElementRef, virtualizer } = usePostTimelineVirtualizer({
    posts: sortedPosts,
  });

  if (sortedPosts.length === 0) {
    return (
      <>
        <div
          {...dragHandlers}
          className={cn(
            "h-full w-full flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed transition-colors",
            isOver ? "border-primary bg-primary/10" : "border-base-300",
            isDragging && "border-primary/50"
          )}
        >
          <CalendarDays
            className={cn(
              "h-12 w-12 transition-colors",
              isOver ? "text-primary" : "text-base-content/30"
            )}
          />
          <div className="text-center">
            <h3 className="text-lg font-semibold">No posts yet</h3>
            <p className="text-sm text-base-content/60 mt-1">
              Drag media here to create your first post
            </p>
          </div>
        </div>

        <CreatePostDialog
          open={isDialogOpen}
          onOpenChange={handleClose}
          media={droppedMedias}
        />
      </>
    );
  }

  return (
    <ScrollArea className={cn("h-full pr-4", className)} ref={scrollElementRef}>
      <div
        style={{
          height: virtualizer.getTotalSize(),
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow: TimelineVirtualItem) => {
          const post = sortedPosts[virtualRow.index];
          const id = isVirtualPost(post) ? post.virtualId : post.id;
          const previousPost =
            virtualRow.index > 0 ? sortedPosts[virtualRow.index - 1] : undefined;

          return (
            <div
              key={id}
              ref={virtualizer.measureElement}
              data-index={virtualRow.index}
              className="pb-4"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <PostPreview
                post={post}
                onUpdate={onUpdate}
                isOpen={openPostId === id}
                onOpenChange={(isOpen) => setOpenPostId(isOpen ? id : null)}
                previousPostInList={previousPost}
              />
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};

