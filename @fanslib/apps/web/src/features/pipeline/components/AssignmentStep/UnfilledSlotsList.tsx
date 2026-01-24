import { AlertTriangle } from "lucide-react";
import type { AssignMediaResponseSchema } from "@fanslib/server/schemas";
import { UnfilledSlotItem } from "./UnfilledSlotItem";

type UnfilledSlotsListProps = {
  slots: typeof AssignMediaResponseSchema.static["unfilled"];
  schedules: Array<{ id: string; name: string; emoji: string | null; color: string | null }>;
  channels: Array<{ id: string; name: string; typeId: string; type?: { id: string } }>;
  onSlotAssign: (slot: typeof AssignMediaResponseSchema.static["unfilled"][number]) => void;
};

export const UnfilledSlotsList = ({ slots, schedules, channels, onSlotAssign }: UnfilledSlotsListProps) => {
  if (slots.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mt-4">
      <div className="flex items-center gap-2 text-base font-medium">
        <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
        <span>
          {slots.length} {slots.length === 1 ? "Slot" : "Slots"} couldn&apos;t be filled
        </span>
      </div>
      <div className="space-y-2">
        {slots.map((slot) => {
          const schedule = schedules.find((s) => s.id === slot.scheduleId);
          const channel = channels.find((c) => c.id === slot.channelId);
          return (
            <UnfilledSlotItem
              key={`${slot.scheduleId}-${slot.date}`}
              slot={slot}
              schedule={schedule}
              channel={channel}
              onAssign={() => onSlotAssign(slot)}
            />
          );
        })}
      </div>
    </div>
  );
};
