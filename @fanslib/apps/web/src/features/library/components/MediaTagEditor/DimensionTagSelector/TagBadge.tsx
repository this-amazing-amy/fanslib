import type { TagDefinition } from "@fanslib/types";
import { Check, Circle, Minus } from "lucide-react";
import { Badge } from "~/components/ui/Badge";
import type { BadgeVariant } from "~/components/ui/Badge/Badge";
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
    if (selectionMode === "radio") {
      return selectionState === "checked" ? (
        <Check className="w-3 h-3" />
      ) : (
        <Circle className="w-3 h-3" />
      );
    }

    // Checkbox mode (default)
    if (selectionState === "checked") return <Check className="w-3 h-3" />;
    if (selectionState === "indeterminate") return <Minus className="w-3 h-3" />;
    return null;
  };

  const badgeVariant = selectionState === "unchecked" ? variant : "neutral";

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
        backgroundColor: selectionState !== "unchecked" ? tag.color : "transparent",
        borderColor: tag.color ?? "hsl(var(--border))",
        color: selectionState !== "unchecked" ? "white" : tag.color ?? "hsl(var(--foreground))",
      }}
      onClick={onClick}
    >
      {getIcon()}
      {tag.displayName}
    </Badge>
  );
};
