import type { ChannelTypeId } from "~/lib/channel-types";
import { ChannelTypeIcon } from "~/components/ChannelTypeIcon";
import { useChannelsQuery } from "~/lib/queries/channels";
import { cn } from "~/lib/cn";

type AssignmentChannelSelectionProps = {
  selectedChannelIds: string[];
  channelSlotCounts: Record<string, number>;
  onChannelToggle: (channelId: string) => void;
};

export const AssignmentChannelSelection = ({
  selectedChannelIds,
  channelSlotCounts,
  onChannelToggle,
}: AssignmentChannelSelectionProps) => {
  const { data: channels = [] } = useChannelsQuery();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {channels?.map((channel) => {
        const isSelected = selectedChannelIds.includes(channel.id);
        return (
          <button
            key={channel.id}
            type="button"
            onClick={() => onChannelToggle(channel.id)}
            className={cn(
              "flex items-center justify-between px-4 py-3 rounded-lg transition-colors cursor-pointer text-left",
              isSelected
                ? "bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100"
                : "bg-base-200 hover:bg-purple-100/50 dark:hover:bg-purple-900/20"
            )}
          >
            <div className="flex items-center gap-2">
              <ChannelTypeIcon typeId={channel.typeId as ChannelTypeId} className="w-5 h-5" />
              <span className="text-base font-medium">{channel.name}</span>
            </div>
            <span className={cn("text-sm", isSelected ? "text-purple-700 dark:text-purple-200" : "text-base-content/60")}>
              {channelSlotCounts[channel.id] ?? 0} slots
            </span>
          </button>
        );
      })}
    </div>
  );
};
