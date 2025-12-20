import { Link } from "@tanstack/react-router";
import { cn } from "~/lib/cn";
import { useChannelsQuery } from "~/lib/queries/channels";
import { ChannelBadge } from "./ChannelBadge";

type ChannelSelectProps = {
  value?: string[];
  onChange: (value: string[]) => void;
  multiple?: boolean;
  disabledChannels?: string[];
  selectable?: boolean;
  className?: string;
};

export const ChannelSelect = ({
  value = [],
  onChange,
  multiple = true,
  disabledChannels = [],
  selectable = true,
  className,
}: ChannelSelectProps) => {
  const { data: channels = [] } = useChannelsQuery();

  const handleToggleChannel = (channelId: string) => {
    if (disabledChannels.includes(channelId)) return;

    if (value.includes(channelId)) {
      onChange(value.filter((id) => id !== channelId));
    } else {
      if (multiple) {
        onChange([...value, channelId]);
      } else {
        onChange([channelId]);
      }
    }
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {(!channels || channels.length === 0) && (
        <>
          <div className="text-sm text-base-content/60">No channels found.</div>
          <Link to="/content/channels" className="text-sm hover:underline">
            Create a channel
          </Link>
        </>
      )}

      {channels?.map((channel) => {
        const isDisabled = disabledChannels.includes(channel.id);
        const isSelected = value.includes(channel.id);

        return (
          <ChannelBadge
            key={channel.id}
            name={channel.name}
            typeId={channel.type.id}
            selectable={selectable}
            selected={isSelected}
            disabled={isDisabled}
            responsive={false}
            className={cn(!multiple && value.length > 0 && !isSelected && "opacity-50")}
            onSelectionChange={() => handleToggleChannel(channel.id)}
          />
        );
      })}
    </div>
  );
};

