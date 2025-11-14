import { cn } from "~/lib/cn";
import { CHANNEL_TYPES, type ChannelTypeId } from "~/lib/channel-types";
import { Badge } from "./ui/Badge";
import { ChannelTypeIcon } from "./ChannelTypeIcon";

type ChannelBadgeProps = {
  name?: string;
  typeId: string;
  size?: "default" | "sm" | "lg";
  selected?: boolean;
  selectable?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  noName?: boolean;
};

export const ChannelBadge = ({
  name = "",
  typeId,
  size = "default",
  selected = false,
  selectable = false,
  disabled = false,
  onClick,
  className,
  noName = false,
}: ChannelBadgeProps) => {
  const channelType = CHANNEL_TYPES[typeId as ChannelTypeId];

  return (
    <Badge
      variant={selected ? "default" : "outline"}
      size={size}
      className={cn(
        "flex items-center cursor-pointer",
        {
          "gap-2": size === "default",
          "gap-1": size === "sm",
          "gap-3": size === "lg",
        },
        onClick || (selectable && "transition-colors cursor-pointer"),
        disabled && "opacity-30 cursor-not-allowed",
        className
      )}
      style={{
        backgroundColor:
          (selectable && selected) || !selectable ? channelType.color : "transparent",
        borderColor: channelType.color,
        color: (selectable && selected) || !selectable ? "white" : channelType.color,
      }}
      onClick={!disabled ? onClick : undefined}
    >
      <ChannelTypeIcon
        typeId={typeId as ChannelTypeId}
        color={(selectable && selected) || !selectable ? "white" : channelType.color}
        className={cn("w-4 h-4", size === "sm" && "w-3 h-3")}
      />
      {!noName && name}
    </Badge>
  );
};

