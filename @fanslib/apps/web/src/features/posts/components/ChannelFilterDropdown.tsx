import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "~/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuPopover,
  DropdownMenuTrigger,
} from "~/components/ui/DropdownMenu";
import { cn } from "~/lib/cn";
import { useChannelsQuery } from "~/lib/queries/channels";
import { ChannelBadge } from "~/components/ChannelBadge";

type ChannelFilterDropdownProps = {
  value?: string[];
  onChange: (channelIds: string[]) => void;
};

export const ChannelFilterDropdown = ({ value = [], onChange }: ChannelFilterDropdownProps) => {
  const { data: channelsData, isLoading } = useChannelsQuery();
  const channels = channelsData ?? [];

  const handleToggleChannel = (channelId: string) => {
    if (value.includes(channelId)) {
      onChange(value.filter((id) => id !== channelId));
    } else {
      onChange([...value, channelId]);
    }
  };

  const selectedChannels = channels.filter((channel) => value.includes(channel.id));

  return (
    <DropdownMenuTrigger>
      <Button
        variant="outline"
        className="w-full justify-between min-w-[200px]"
      >
        {selectedChannels.length > 0 ? (
          <div className="flex gap-1 flex-wrap">
            {selectedChannels.map((channel) => (
              <ChannelBadge
                key={channel.id}
                name={channel.name}
                typeId={channel.type.id}
                selectable={false}
                selected={true}
                responsive={false}
                size="sm"
              />
            ))}
          </div>
        ) : (
          <span className="text-base-content">Select channels...</span>
        )}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      <DropdownMenuPopover placement="bottom start" className="w-[min(480px,100vw-32px)]">
        {isLoading ? (
          <div className="py-6 text-center text-sm text-base-content/50">Loading...</div>
        ) : channels.length === 0 ? (
          <div className="py-6 text-center text-sm text-base-content/50">No channels found.</div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            <DropdownMenu onAction={(key) => handleToggleChannel(key as string)}>
              {channels.map((channel) => (
                <DropdownMenuItem key={channel.id} id={channel.id} className="flex items-center gap-2">
                  <Check
                    className={cn(
                      "h-4 w-4",
                      value.includes(channel.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <ChannelBadge
                    name={channel.name}
                    typeId={channel.type.id}
                    selectable={false}
                    selected={value.includes(channel.id)}
                    responsive={false}
                  />
                </DropdownMenuItem>
              ))}
            </DropdownMenu>
          </div>
        )}
      </DropdownMenuPopover>
    </DropdownMenuTrigger>
  );
};
