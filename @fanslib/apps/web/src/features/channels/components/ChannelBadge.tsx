import type { ChannelSchema } from "@fanslib/server/schemas";

type Channel = typeof ChannelSchema.static;
import { Badge } from "~/components/ui/Badge/Badge";
import { cn } from "~/lib/cn";
import { ChannelTypeIcon } from "./ChannelTypeIcon";

type ChannelBadgeProps = {
  channel: Channel;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
};

export const ChannelBadge = ({
  channel,
  selected = false,
  onClick,
  className,
}: ChannelBadgeProps) => (
  <Badge
    variant={selected ? "primary" : "neutral"}
    className={cn(
      "gap-1.5 cursor-pointer transition-all",
      onClick && "hover:scale-105",
      className
    )}
    onClick={onClick}
  >
    <ChannelTypeIcon typeId={channel.typeId} className="w-4 h-4" />
    <span>{channel.name}</span>
  </Badge>
);
