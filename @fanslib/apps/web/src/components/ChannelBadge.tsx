import { CHANNEL_TYPES, type ChannelTypeId } from "~/lib/channel-types";
import { cn } from "~/lib/cn";
import { mixHexColors } from "~/lib/color-utils";
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

const BADGE_SIZE_CLASSES: Record<NonNullable<ChannelBadgeProps["size"]>, string> = {
  sm: "px-1.5 py-0.5 text-[10px] gap-1 leading-tight",
  md: "px-2 py-0.5 text-xs gap-1.5",
  lg: "px-2.5 py-1 text-sm gap-1.5",
};

const ICON_SIZE_CLASSES: Record<NonNullable<ChannelBadgeProps["size"]>, string> = {
  sm: "h-2.5 w-2.5",
  md: "h-3 w-3",
  lg: "h-3.5 w-3.5",
};

export const ChannelBadge = ({
  name = "",
  typeId,
  size = "sm",
  selected: selectedProp = false,
  selectable = false,
  disabled = false,
  onClick,
  className,
  noName = false,
}: ChannelBadgeProps) => {
  const channelType = CHANNEL_TYPES[typeId as ChannelTypeId];
  const baseColor = channelType?.color ?? "#6b7280";
  const isSelected = Boolean(selectedProp);
  const backgroundMix = isSelected ? 0.6 : 0.82;
  const backgroundColor = mixHexColors(baseColor, "#ffffff", backgroundMix);
  const borderColor = mixHexColors(baseColor, "#0f172a", 0.18);
  const foregroundColor = mixHexColors(baseColor, "#111827", 0.55);

  const isClickable = Boolean(onClick ?? selectable);

  return (
    <div
      className={cn(
        "rounded-full font-medium flex items-center border-2",
        BADGE_SIZE_CLASSES[size],
        isClickable && "cursor-pointer transition-colors",
        disabled && "opacity-30 cursor-not-allowed",
        className
      )}
      style={{
        backgroundColor,
        borderColor,
        color: foregroundColor,
      }}
      onClick={!disabled ? onClick : undefined}
    >
      <ChannelTypeIcon
        typeId={typeId as ChannelTypeId}
        color={foregroundColor}
        className={cn("shrink-0", ICON_SIZE_CLASSES[size])}
      />
      {!noName && <span>{name}</span>}
    </div>
  );
};
