import { Plus } from "lucide-react";
import { useState } from "react";
import type { MediaSchema } from "@fanslib/server/schemas";
import { useMediaDrag } from "~/contexts/MediaDragContext";

type Media = typeof MediaSchema.static;
import { useDragOver } from "~/hooks/useDragOver";
import { cn } from "~/lib/cn";
import { CreatePostDialog } from "~/features/library/components/CreatePostDialog";

type PostTimelineDropZoneProps = {
  className?: string;
  previousPostDate: Date;
};

export const PostTimelineDropZone = ({
  className,
  previousPostDate,
}: PostTimelineDropZoneProps) => {
  const { isDragging, draggedMedias, endMediaDrag } = useMediaDrag();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [droppedMedias, setDroppedMedias] = useState<Media[]>([]);

  const { isOver, dragHandlers, setIsOver } = useDragOver({
    onDrop: async () => {
      if (draggedMedias.length === 0) return;
      setDroppedMedias(draggedMedias);
      setIsDialogOpen(true);
      endMediaDrag();
    },
  });

  const handleClose = () => {
    setIsDialogOpen(false);
    setIsOver(false);
  };

  if (!isDragging && !isDialogOpen) {
    return null;
  }

  const nextDate = new Date(previousPostDate);
  nextDate.setDate(nextDate.getDate() + 1);

  return (
    <>
      <div
        className={cn(
          "h-8 mx-4 rounded-lg border-2 border-dashed flex items-center justify-center transition-colors",
          isOver ? "border-primary bg-primary/10" : "border-base-300",
          className
        )}
        {...dragHandlers}
      >
        <Plus
          className={cn(
            "h-4 w-4 transition-colors",
            isOver ? "text-primary" : "text-base-content/60"
          )}
        />
      </div>

      <CreatePostDialog
        open={isDialogOpen}
        onOpenChange={handleClose}
        media={droppedMedias}
      />
    </>
  );
};

