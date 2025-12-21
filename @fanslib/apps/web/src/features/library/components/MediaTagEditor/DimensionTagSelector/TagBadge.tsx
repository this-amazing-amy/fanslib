import { Badge, type BadgeSize } from "~/components/Badge";
import { cn } from "~/lib/cn";
import { getColorDefinitionFromString } from "~/lib/colors";
import type { SelectionState } from "~/lib/tags/selection-state";

type TagLike = {
  id: number;
  color: string | null;
  displayName: string;
};

type TagBadgeProps = {
  tag: TagLike;
  selectionState?: SelectionState;
  onSelectionChange?: (nextState: SelectionState) => void;
  className?: string;
  selectionMode?: "checkbox" | "radio";
  size?: BadgeSize;
  responsive?: boolean;
};

export const TagBadge = ({
  tag,
  selectionState,
  onSelectionChange,
  className,
  selectionMode = "checkbox",
  size = "lg",
  responsive = false,
}: TagBadgeProps) => {
  const colorDef = getColorDefinitionFromString(tag.color, tag.id);
  const isSelected = selectionState === "checked" || selectionState === "indeterminate";

  const backgroundColor = `color-mix(in oklch, ${colorDef.background} 80%, transparent)`;
  const borderColor = `color-mix(in oklch, ${colorDef.background} 30%, transparent)`;

  const handleSelectionChange = (nextSelected: boolean) => {
    if (!onSelectionChange) return;
    if (selectionMode === "radio") {
      onSelectionChange(nextSelected ? "checked" : "unchecked");
      return;
    }
    if (!isSelected && nextSelected) {
      onSelectionChange("checked");
      return;
    }
    if (isSelected && !nextSelected) {
      onSelectionChange("unchecked");
    }
  };

  return (
    <Badge
      className={cn(
        "cursor-pointer flex items-center gap-1",
        className
      )}
      size={size}
      selected={isSelected}
      selectable
      backgroundColor={backgroundColor}
      foregroundColor={colorDef.foreground}
      borderColor={borderColor}
      label={tag.displayName}
      responsive={responsive}
      onSelectionChange={handleSelectionChange}
    />
  );
};
