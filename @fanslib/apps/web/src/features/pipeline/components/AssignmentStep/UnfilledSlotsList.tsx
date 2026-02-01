import { AlertTriangle } from "lucide-react";
import type { AssignMediaResponse, AssignMediaResponseSchema, Media } from '@fanslib/server/schemas';
import type { MediaSchema } from "@fanslib/server/schemas";
import { UnfilledSlotDropzone } from "./UnfilledSlotDropzone";
import { UnfilledSlotsLibrary } from "./UnfilledSlotsLibrary";

type UnfilledSlotsListProps = {
  slots: AssignMediaResponse["unfilled"];
  schedules: Array<{ id: string; name: string; emoji: string | null; color: string | null }>;
  channels: Array<{ id: string; name: string; typeId: string; type?: { id: string } }>;
  onSlotAssign: (
    slot: AssignMediaResponse["unfilled"][number],
    medias: Media[]
  ) => void;
};

export const UnfilledSlotsList = ({ slots, schedules, channels, onSlotAssign }: UnfilledSlotsListProps) => {
  if (slots.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="mt-2 flex items-center gap-2 text-base font-medium">
        <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
        <span>
          {slots.length} {slots.length === 1 ? "Slot" : "Slots"} couldn&apos;t be filled
        </span>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="min-h-[520px] overflow-hidden">
          <UnfilledSlotsLibrary />
        </div>
        <div className="space-y-3">
          {slots.map((slot) => {
            const schedule = schedules.find((s) => s.id === slot.scheduleId);
            const channel = channels.find((c) => c.id === slot.channelId);
            return (
              <UnfilledSlotDropzone
                key={`${slot.scheduleId}-${slot.date}`}
                slot={slot}
                schedule={schedule}
                channel={channel}
                onDropMedia={onSlotAssign}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
