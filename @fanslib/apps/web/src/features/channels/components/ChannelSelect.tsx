import type { Channel, ChannelSchema } from '@fanslib/server/schemas';


import { useChannelsQuery } from "~/lib/queries/channels";
import { cn } from "~/lib/cn";
import { ChannelBadge } from "./ChannelBadge";

type ChannelSelectProps = {
  value: string[];
  onChange: (channelIds: string[]) => void;
  className?: string;
};

export const ChannelSelect = ({ value, onChange, className }: ChannelSelectProps) => {
  const { data: channels, isLoading } = useChannelsQuery();

  const toggleChannel = (channelId: string) => {
    const isSelected = value.includes(channelId);
    onChange(
      isSelected
        ? value.filter((id) => id !== channelId)
        : [...value, channelId]
    );
  };

  if (isLoading) {
    return <div className="text-sm text-base-content/60">Loading channels...</div>;
  }

  if (!channels || channels.length === 0) {
    return <div className="text-sm text-base-content/60">No channels available</div>;
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {channels.map((channel: Channel) => (
        <ChannelBadge
          key={channel.id}
          channel={channel}
          selected={value.includes(channel.id)}
          onClick={() => toggleChannel(channel.id)}
        />
      ))}
    </div>
  );
};
