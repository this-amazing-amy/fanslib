import type { ShootSummary, ShootSummarySchema } from '@fanslib/server/schemas';
import { ImageIcon, Plus, VideoIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { type FC } from "react";
import { Card, CardBody } from "~/components/ui/Card";
import { MediaPreview } from "~/components/MediaPreview";
import { useMediaDrag } from "~/contexts/MediaDragContext";
import { useDragOver } from "~/hooks/useDragOver";
import { cn } from "~/lib/cn";
import { useMediaListQuery } from "~/lib/queries/library";
import { useUpdateShootMutation } from "~/lib/queries/shoots";


type ShootCardProps = {
  shoot: ShootSummary;
  groupedMedia: Map<string, unknown[]>;
  onUpdate: () => void;
};

export const ShootCard: FC<ShootCardProps> = ({ shoot, onUpdate }) => {
  const imageCount = shoot.media?.filter((m) => m.type === "image").length ?? 0;
  const videoCount = shoot.media?.filter((m) => m.type === "video").length ?? 0;
  const mediaItems = shoot.media?.slice(0, 4) ?? [];
  
  const shootDate = new Date(shoot.shootDate);
  const currentYear = new Date().getFullYear();
  const isCurrentYear = shootDate.getFullYear() === currentYear;
  const dateFormat = isCurrentYear ? "MMMM d" : "MMMM d, yyyy";

  const { isDragging, draggedMedias, endMediaDrag } = useMediaDrag();
  const { refetch: refetchLibrary } = useMediaListQuery();
  const updateMutation = useUpdateShootMutation();

  const { isOver, dragHandlers } = useDragOver({
    onDragOver: (e) => {
      if (draggedMedias.length === 0) return;

      const hasNewDraggedMedia = draggedMedias.some(
        (media) => !shoot.media?.some((m) => m.id === media.id)
      );
      if (hasNewDraggedMedia) return;

      e.dataTransfer.dropEffect = "none";
    },
    onDrop: async () => {
      if (draggedMedias.length === 0) return;

      const newMediaIds = draggedMedias
        .filter((media) => !shoot.media?.some((m) => m.id === media.id))
        .map((media) => media.id);

      if (newMediaIds.length === 0) return;

      try {
        await updateMutation.mutateAsync({
          id: shoot.id,
          updates: {
            mediaIds: [...(shoot.media?.map((m) => m.id) ?? []), ...newMediaIds],
          },
        });
        onUpdate();
        await refetchLibrary();
        endMediaDrag();
      } catch (error) {
        console.error("Failed to add media to shoot:", error);
      }
    },
  });

  const hasNewMedia = draggedMedias.some((media) => !shoot.media?.some((m) => m.id === media.id));
  const showDropzone = isDragging && hasNewMedia;

  return (
    <div
      {...(isDragging ? dragHandlers : {})}
      className={cn("relative group", {
        "after:absolute after:inset-0 after:rounded-md after:border-2 after:border-dashed after:pointer-events-none":
          isDragging && hasNewMedia,
        "after:border-primary after:bg-primary/10": isOver && isDragging && hasNewMedia,
        "after:border-base-300 after:bg-base-300/40": isDragging && !isOver && hasNewMedia,
      })}
    >
      <Link to="/shoots/$shootId" params={{ shootId: shoot.id }}>
        <Card className="overflow-hidden border-base-content cursor-pointer">
          <CardBody className="p-0">
            <div className="p-4">
              {mediaItems.length > 0 && (
                mediaItems.length === 1 ? (
                  <div className="mb-3 aspect-square rounded-lg overflow-hidden bg-base-200">
                    <MediaPreview media={mediaItems[0]} className="w-full h-full" />
                  </div>
                ) : (
                  <div className="mb-3 aspect-square rounded-lg overflow-hidden grid grid-cols-2 gap-1">
                    {mediaItems.map((media) => (
                      <div key={media.id} className="bg-base-200 rounded-md overflow-hidden">
                        <MediaPreview media={media} className="w-full h-full" />
                      </div>
                    ))}
                  </div>
                )
              )}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-base font-semibold">{shoot.name}</div>
                  <div className="flex items-center gap-3 text-sm text-base-content/60">
                    {imageCount > 0 && (
                      <div className="flex items-center gap-1">
                        <span>{imageCount}</span>
                        <ImageIcon className="w-3.5 h-3.5" />
                      </div>
                    )}
                    {videoCount > 0 && (
                      <div className="flex items-center gap-1">
                        <span>{videoCount}</span>
                        <VideoIcon className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-base-content/70">
                  <span>{format(shootDate, dateFormat)}</span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </Link>
      {showDropzone && (
        <Plus
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 transition-colors pointer-events-none",
            "text-primary"
          )}
        />
      )}
    </div>
  );
};

