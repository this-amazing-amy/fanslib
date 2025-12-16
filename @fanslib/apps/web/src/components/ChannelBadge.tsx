import { CHANNEL_TYPES, type ChannelTypeId } from "~/lib/channel-types";
import { cn } from "~/lib/cn";
import { mixHexColors } from "~/lib/color-utils";
import { Badge } from "./Badge";
import { ChannelTypeIcon } from "./ChannelTypeIcon";

type ChannelBadgeProps = {
  name?: string;
  typeId: string;
  size?: "sm" | "md" | "lg";
  selected?: boolean;
  selectable?: boolean;
  disabled?: boolean;
  onSelectionChange?: (nextSelected: boolean) => void;
  className?: string;
  noName?: boolean;
};

const ICON_SIZE_CLASSES: Record<NonNullable<ChannelBadgeProps["size"]>, string> = {
  sm: "h-2.5 w-2.5",
  md: "h-3 w-3",
  lg: "h-3.5 w-3.5",
};

export const ChannelBadge = ({
  name = "",
  typeId,
  size = "md",
  selected: selectedProp = false,
  selectable = false,
  disabled = false,
  onSelectionChange,
  className,
  noName = false,
}: ChannelBadgeProps) => {
  const channelType = CHANNEL_TYPES[typeId as ChannelTypeId];
  const baseColor = channelType?.color ?? "#6b7280";
  const isSelected = Boolean(selectedProp);
  const backgroundColor = mixHexColors(baseColor, "#ffffff", 0.6);
  const borderColor = mixHexColors(baseColor, "#0f172a", 0.18);
  const foregroundColor = mixHexColors(baseColor, "#111827", 0.55);

  return (
    <Badge
      size={size}
      className={cn(
        "rounded-full font-medium flex items-center gap-1.5",
        disabled && "opacity-30 cursor-not-allowed",
        className
      )}
      selected={isSelected}
      selectable={selectable}
      disabled={disabled}
      backgroundColor={backgroundColor}
      foregroundColor={foregroundColor}
      borderColor={borderColor}
      label={noName ? "" : name}
      icon={
        <ChannelTypeIcon
          typeId={typeId as ChannelTypeId}
          color={foregroundColor}
          className={cn("shrink-0", ICON_SIZE_CLASSES[size])}
        />
      }
      onSelectionChange={onSelectionChange}
    />
  );
};
