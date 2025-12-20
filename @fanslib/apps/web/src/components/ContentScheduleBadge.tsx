import { cn } from "~/lib/cn";
import { DEFAULT_SCHEDULE_COLOR, getColorDefinitionFromString } from "~/lib/colors";
import { Badge } from "./Badge";

type ContentScheduleBadgeProps = {
  name: string;
  emoji?: string | null;
  color?: string | null;
  size?: "sm" | "md" | "lg";
  borderStyle?: 'visible' | 'none';
  selected?: boolean;
  selectable?: boolean;
  responsive?: boolean;
  onSelectionChange?: (nextSelected: boolean) => void;
  className?: string;
};

export const ContentScheduleBadge = ({
  name,
  emoji,
  color = DEFAULT_SCHEDULE_COLOR,
  size = "md",
  borderStyle = 'visible',
  selected = true,
  selectable = false,
  responsive,
  onSelectionChange,
  className,
}: ContentScheduleBadgeProps) => {
  const colorDef = getColorDefinitionFromString(color, 0);
  const isSelected = Boolean(selected);

  return (
    <Badge
      size={size}
      className={cn(
        "rounded-full font-medium",
        className
      )}
      selected={isSelected}
      selectable={selectable}
      responsive={responsive}
      backgroundColor={colorDef.background}
      foregroundColor={colorDef.foreground}
      borderColor={colorDef.foreground}
      borderStyle={borderStyle}
      label={name}
      icon={emoji ? <span>{emoji}</span> : undefined}
      onSelectionChange={onSelectionChange}
    />
  );
};
