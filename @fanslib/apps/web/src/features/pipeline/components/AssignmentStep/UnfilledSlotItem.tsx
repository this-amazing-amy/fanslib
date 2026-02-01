import { format } from "date-fns";
import { ImagePlus } from "lucide-react";
import type { AssignMediaResponse, AssignMediaResponseSchema } from '@fanslib/server/schemas';
import { ContentScheduleBadge } from "~/components/ContentScheduleBadge";
import { ChannelBadge } from "~/components/ChannelBadge";
import { Button } from "~/components/ui/Button";
import { getUnfilledSlotReasonText } from "./unfilled-slot-utils";

type UnfilledSlot = AssignMediaResponse["unfilled"][number];

type UnfilledSlotItemProps = {
  slot: UnfilledSlot;
  schedule: { name: string; emoji: string | null; color: string | null } | undefined;
  channel: { name: string; typeId: string; type?: { id: string } } | undefined;
  onAssign: () => void;
};

export const UnfilledSlotItem = ({ slot, schedule, channel, onAssign }: UnfilledSlotItemProps) => {
  const slotDate = new Date(slot.date);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-base-300 p-3">
      <Button
        size="icon"
        variant="outline"
        aria-label="Assign manually"
        onClick={onAssign}
        className="flex-shrink-0"
      >
        <ImagePlus className="h-4 w-4" />
      </Button>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-base font-semibold text-base-content">
          {format(slotDate, "MMM d")}
        </span>
        <span className="text-sm font-medium text-base-content/60">
          {format(slotDate, "HH:mm")}
        </span>
        <span className="text-xs text-orange-600 dark:text-orange-400">
          ({getUnfilledSlotReasonText(slot.reason)})
        </span>
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
  );
};
