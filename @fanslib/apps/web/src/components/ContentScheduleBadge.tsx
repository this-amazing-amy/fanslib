import { cn } from "~/lib/cn";
import { DEFAULT_SCHEDULE_COLOR, getColorDefinitionFromString } from "~/lib/colors";
import { Badge } from "./Badge";

type ContentScheduleBadgeProps = {
  name: string;
  emoji?: string | null;
  color?: string | null;
  size?: "sm" | "md" | "lg";
  selected?: boolean;
  selectable?: boolean;
  onSelectionChange?: (nextSelected: boolean) => void;
  className?: string;
};

export const ContentScheduleBadge = ({
  name,
  emoji,
  color = DEFAULT_SCHEDULE_COLOR,
  size = "md",
  selected = true,
  selectable = false,
  onSelectionChange,
  className,
}: ContentScheduleBadgeProps) => {
  const colorDef = getColorDefinitionFromString(color, 0);
  const isSelected = Boolean(selected);

  return (
    <Badge
      size={size}
      className={cn(
        "rounded-full font-medium flex items-center gap-1.5",
        className
      )}
      selected={isSelected}
      selectable={selectable}
      backgroundColor={colorDef.background}
      foregroundColor={colorDef.foreground}
      borderColor={colorDef.foreground}
      label={name}
      icon={emoji ? <span>{emoji}</span> : undefined}
      onSelectionChange={onSelectionChange}
    />
  );
};
