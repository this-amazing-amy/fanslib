import type { TagDefinitionSchema } from "@fanslib/server/schemas";

type TagDefinition = typeof TagDefinitionSchema.static;
import { Check, Minus } from "lucide-react";
import { Badge } from "~/components/ui/Badge";
import type { BadgeVariant } from "~/components/ui/Badge/Badge";
import { getColorDefinitionFromString } from "~/lib/colors";
import { cn } from "~/lib/cn";
import type { SelectionState } from "~/lib/tags/selection-state";

type TagBadgeProps = {
  tag: TagDefinition;
  selectionState?: SelectionState;
  onClick?: () => void;
  variant?: BadgeVariant
  className?: string;
  selectionMode?: "checkbox" | "radio";
};

export const TagBadge = ({
  tag,
  selectionState,
  onClick,
  variant = "secondary",
  className,
  selectionMode = "checkbox",
}: TagBadgeProps) => {
  const getIcon = () => {
    // Radio mode: no icons, selection indicated by fill vs outline
    if (selectionMode === "radio") return null;

    // Checkbox mode (default)
    if (selectionState === "checked") return <Check className="w-3 h-3" />;
    if (selectionState === "indeterminate") return <Minus className="w-3 h-3" />;
    return null;
  };

  const badgeVariant = selectionState === "unchecked" ? variant : "neutral";
  const colorDef = getColorDefinitionFromString(tag.color, tag.id);

  return (
    <Badge
      variant={badgeVariant}
      className={cn(
        "cursor-pointer transition-colors flex items-center gap-1",
        onClick && "select-none",
        selectionMode === "radio" && "border",
        className
      )}
      size="lg"
      style={{
        backgroundColor: selectionState !== "unchecked"
          ? colorDef.background
          : `color-mix(in oklch, ${colorDef.background} 12%, transparent)`,
        borderColor: colorDef.foreground,
        color: colorDef.foreground,
      }}
      onClick={onClick}
    >
      {getIcon()}
      {tag.displayName}
    </Badge>
  );
};
