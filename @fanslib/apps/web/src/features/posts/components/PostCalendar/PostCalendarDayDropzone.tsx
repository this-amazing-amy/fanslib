import type { Media } from '@fanslib/server/schemas';
import { Plus } from "lucide-react";
import { useState } from "react";
import { useMediaDrag } from "~/contexts/MediaDragContext";


import { CreatePostDialog } from "~/features/library/components/CreatePostDialog";
import { useDragOver } from "~/hooks/useDragOver";
import { cn } from "~/lib/cn";

type PostCalendarDayDropzoneProps = {
  date: Date;
  onUpdate: () => Promise<void>;
};

export const PostCalendarDayDropzone = ({ date: _date, onUpdate }: PostCalendarDayDropzoneProps) => {
  const { isDragging, draggedMedias, endMediaDrag } = useMediaDrag();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [droppedMedias, setDroppedMedias] = useState<Media[]>([]);

  const { isOver, dragHandlers } = useDragOver({
    shouldStopPropagation: true,
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

  if (!isDragging && !isDialogOpen) {
    return null;
  }

  return (
    <>
      <div
        {...dragHandlers}
        className={cn(
          "h-8 rounded-lg border-2 border-dashed flex items-center justify-center transition-colors mt-2",
          isOver ? "border-primary bg-primary/10" : "border-base-300"
        )}
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

