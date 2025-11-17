import { ShootSummarySchema } from "@fanslib/server/schemas";
import { Plus } from "lucide-react";
import { type FC } from "react";
import { useMediaDrag } from "~/contexts/MediaDragContext";

type ShootSummary = typeof ShootSummarySchema.static;
import { useDragOver } from "~/hooks/useDragOver";
import { cn } from "~/lib/cn";
import { useMediaListQuery } from "~/lib/queries/library";
import { useUpdateShootMutation } from "~/lib/queries/shoots";

type ShootDetailDropZoneProps = {
  shoot: ShootSummary;
  onUpdate: () => void;
};

export const ShootDetailDropZone: FC<ShootDetailDropZoneProps> = ({ shoot, onUpdate }) => {
  const { draggedMedias } = useMediaDrag();
  const { refetch: refetchLibrary } = useMediaListQuery();
  const updateMutation = useUpdateShootMutation();

  const { isOver, dragHandlers } = useDragOver({
    onDragOver: (e) => {
      if (draggedMedias.length === 0) return;

      // Don't show copy cursor if all media items are already in the shoot
      const hasNewDraggedMedia = draggedMedias.some(
        (media) => !shoot.media?.some((m) => m.id === media.id)
      );
      if (hasNewDraggedMedia) return;

      e.dataTransfer.dropEffect = "none";
    },
    onDrop: async () => {
      if (draggedMedias.length === 0) return;

      // Filter out media items that are already in the shoot
      const newMediaIds = draggedMedias
        .filter((media) => !shoot.media?.some((m) => m.id === media.id))
        .map((media) => media.id);

      if (newMediaIds.length === 0) return;

      try {
        await updateMutation.mutateAsync({
          id: shoot.id,
          updates: {
            mediaIds: [...(shoot.media?.map((m) => m.id) || []), ...newMediaIds],
          },
        });
        onUpdate();
        await refetchLibrary();
      } catch (error) {
        console.error("Failed to add media to shoot:", error);
      }
    },
  });

  // Don't show drop zone if all media items are already in the shoot
  const hasNewMedia = draggedMedias.some((media) => !shoot.media?.some((m) => m.id === media.id));
  if (draggedMedias.length > 0 && !hasNewMedia) {
    return null;
  }

  return (
    <div
      className={cn(
        "aspect-square rounded-lg border-2 border-dashed flex items-center justify-center transition-colors",
        isOver ? "border-primary bg-primary/10" : "border-muted"
      )}
      {...dragHandlers}
    >
      <Plus className="h-4 w-4 text-muted-foreground" />
    </div>
  );
};
