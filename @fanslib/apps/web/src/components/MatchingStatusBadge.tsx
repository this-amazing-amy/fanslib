import { Check, Clock, EyeOff } from "lucide-react";
import { Badge, type BadgeSize } from "./Badge";
import { MATCHING_STATUS_COLORS } from "~/lib/colors";

type MatchingStatus = "pending" | "matched" | "ignored";

type MatchingStatusBadgeProps = {
  status: MatchingStatus;
  size?: BadgeSize;
  selected?: boolean;
  selectable?: boolean;
  showIcon?: boolean;
  responsive?: boolean;
  onSelectionChange?: (nextSelected: boolean) => void;
  className?: string;
};

const STATUS_ICON: Record<MatchingStatus, React.ComponentType<{ className?: string }>> = {
  pending: Clock,
  matched: Check,
  ignored: EyeOff,
};

export const MatchingStatusBadge = ({
  status,
  size = "sm",
  selected = true,
  selectable = false,
  showIcon = true,
  responsive,
  onSelectionChange,
  className,
}: MatchingStatusBadgeProps) => {
  const colors = MATCHING_STATUS_COLORS[status];
  const Icon = STATUS_ICON[status];

  const backgroundColor = colors.background;

  return (
    <Badge
      size={size}
      className={className}
      selected={selected}
      selectable={selectable}
      responsive={responsive}
      backgroundColor={backgroundColor}
      foregroundColor={colors.foreground}
      borderColor={colors.foreground}
      label={colors.name}
      icon={
        showIcon ? (
          <Icon
            className={
              size === "sm" ? "h-2.5 w-2.5" : size === "md" ? "h-3 w-3" : "h-3.5 w-3.5"
            }
          />
        ) : undefined
      }
      onSelectionChange={onSelectionChange}
    />
  );
};

