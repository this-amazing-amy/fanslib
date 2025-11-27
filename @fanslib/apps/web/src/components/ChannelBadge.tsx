import { cn } from "~/lib/cn";
import { CHANNEL_TYPES, type ChannelTypeId } from "~/lib/channel-types";
import { darkenColor } from "~/lib/color-utils";
import { ChannelTypeIcon } from "./ChannelTypeIcon";

type ChannelBadgeProps = {
  name?: string;
  typeId: string;
  size?: "sm" | "md" | "lg";
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
  size = "sm",
  selected: _selected = false,
  selectable = false,
  disabled = false,
  onClick,
  className,
  noName = false,
}: ChannelBadgeProps) => {
  const channelType = CHANNEL_TYPES[typeId as ChannelTypeId];
  const bgColor = channelType?.color ?? "#6b7280";

  const isClickable = onClick ?? selectable;

  return (
    <div
      className={cn(
        "rounded-full font-medium flex items-center",
        {
          "px-1.5 py-0.5 text-[10px] gap-1 leading-tight": size === "sm",
          "px-2 py-0.5 text-xs gap-1.5": size === "md",
          "px-2.5 py-1 text-sm gap-1.5": size === "lg",
        },
        isClickable && "cursor-pointer transition-colors",
        disabled && "opacity-30 cursor-not-allowed",
        className
      )}
      style={{
        backgroundColor: bgColor,
        color: "#fff",
      }}
      onClick={!disabled ? onClick : undefined}
    >
      <ChannelTypeIcon
        typeId={typeId as ChannelTypeId}
        color="white"
        className={cn(size === "sm" ? "w-3 h-3" : size === "md" ? "w-3.5 h-3.5" : "w-4 h-4")}
      />
      {!noName && name}
    </div>
  );
};
