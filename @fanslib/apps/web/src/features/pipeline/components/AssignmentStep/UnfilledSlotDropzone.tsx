import { format } from "date-fns";
import { ImagePlus } from "lucide-react";
import type { AssignMediaResponse, Media } from '@fanslib/server/schemas';
import { ChannelBadge } from "~/components/ChannelBadge";
import { ContentScheduleBadge } from "~/components/ContentScheduleBadge";
import { useMediaDrag } from "~/contexts/MediaDragContext";
import { useDragOver } from "~/hooks/useDragOver";
import { cn } from "~/lib/cn";

type UnfilledSlot = AssignMediaResponse["unfilled"][number];

type UnfilledSlotDropzoneProps = {
  slot: UnfilledSlot;
  schedule: { name: string; emoji: string | null; color: string | null } | undefined;
  channel: { name: string; typeId: string; type?: { id: string } } | undefined;
  onDropMedia: (slot: UnfilledSlot, medias: Media[]) => void;
};

export const UnfilledSlotDropzone = ({
  slot,
  schedule,
  channel,
  onDropMedia,
}: UnfilledSlotDropzoneProps) => {
  const slotDate = new Date(slot.date);
  const { draggedMedias, endMediaDrag, isDragging } = useMediaDrag();
  const { isOver, dragHandlers } = useDragOver({
    onDrop: () => {
      if (draggedMedias.length === 0) return;
      onDropMedia(slot, draggedMedias);
      endMediaDrag();
    },
  });

  return (
    <div
      {...dragHandlers}
      className={cn(
        "rounded-lg border-2 border-dashed p-4 transition-colors",
        isOver ? "border-primary bg-primary/10" : "border-base-300",
        isDragging && "border-primary/60"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-base-300 bg-base-100">
          <ImagePlus className={cn("h-4 w-4", isOver ? "text-primary" : "text-base-content/60")} />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-base-content">
              {format(slotDate, "MMM d")}
            </span>
            <span className="text-sm font-medium text-base-content/60">
              {format(slotDate, "HH:mm")}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {schedule && (
            <ContentScheduleBadge
              name={schedule.name}
              emoji={schedule.emoji}
              color={schedule.color}
              size="sm"
              borderStyle="none"
              selected
              responsive={false}
            />
          )}
          {channel && (
            <ChannelBadge
              name={channel.name}
              typeId={channel.type?.id ?? channel.typeId}
              size="sm"
              borderStyle="none"
              responsive={false}
            />
          )}
        </div>
      </div>
    </div>
  );
};
