import type { MediaSchema } from "@fanslib/server/schemas";
import { useDragOver } from "~/hooks/useDragOver";
import { cn } from "~/lib/cn";
import { Plus } from "lucide-react";
import { type FC, useState } from "react";
import { useMediaDrag } from "~/contexts/MediaDragContext";

type Media = typeof MediaSchema.static;
import { CreateShootDialog } from "./CreateShootDialog";

type ShootCreateDropZoneProps = {
  className?: string;
};

export const ShootCreateDropZone: FC<ShootCreateDropZoneProps> = ({ className }) => {
  const { isDragging, draggedMedias } = useMediaDrag();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [droppedMedias, setDroppedMedias] = useState<Media[]>([]);

  const { isOver, dragHandlers, setIsOver } = useDragOver({
    onDrop: async () => {
      if (draggedMedias.length === 0) return;
      setDroppedMedias(draggedMedias);
      setIsDialogOpen(true);
    },
  });

  const handleClose = () => {
    setIsDialogOpen(false);
    setIsOver(false);
  };

  if (!isDragging && !isDialogOpen) {
    return null;
  }

  return (
    <>
      <div
        className={cn(
          "aspect-square rounded-lg border-2 border-dashed flex items-center justify-center transition-colors",
          isOver ? "border-primary bg-primary/10" : "border-muted",
          className
        )}
        {...dragHandlers}
      >
        <Plus
          className={cn(
            "h-4 w-4 transition-colors",
            isOver ? "text-primary" : "text-muted-foreground"
          )}
        />
      </div>

      <CreateShootDialog
        open={isDialogOpen}
        onOpenChange={handleClose}
        selectedMedia={droppedMedias}
      />
    </>
  );
};
