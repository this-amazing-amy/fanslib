import { Check, Minus } from "lucide-react";
import type { CSSProperties } from "react";
import { Badge } from "~/components/ui/Badge";
import type { BadgeProps, BadgeVariant } from "~/components/ui/Badge/Badge";
import { cn } from "~/lib/cn";
import { getColorDefinitionFromString } from "~/lib/colors";
import type { SelectionState } from "~/lib/tags/selection-state";

type TagLike = {
  id: number;
  color: string | null;
  displayName: string;
};

type BadgeSize = BadgeProps["size"];

type TagBadgeProps = {
  tag: TagLike;
  selectionState?: SelectionState;
  onClick?: () => void;
  variant?: BadgeVariant;
  className?: string;
  selectionMode?: "checkbox" | "radio";
  size?: BadgeSize;
};

export const TagBadge = ({
  tag,
  selectionState,
  onClick,
  variant = "secondary",
  className,
  selectionMode = "checkbox",
  size = "lg",
}: TagBadgeProps) => {
  const getIcon = () => {
    if (selectionMode === "radio") return null;
    if (selectionState === "checked") return <Check className="w-3 h-3" />;
    if (selectionState === "indeterminate") return <Minus className="w-3 h-3" />;
    return null;
  };

  const badgeVariant = selectionState === "unchecked" ? variant : "neutral";
  const colorDef = getColorDefinitionFromString(tag.color, tag.id);
  const style = {
    "--tag-bg-full": colorDef.background,
    "--tag-bg-muted": `color-mix(in oklch, ${colorDef.background} 40%, transparent)`,
    borderColor: "transparent",
    color: colorDef.foreground,
  } as CSSProperties;

  return (
    <Badge
      variant={badgeVariant}
      className={cn(
        "cursor-pointer flex items-center gap-1 transition-colors bg-[color:var(--tag-bg-muted)] hover:bg-[color:var(--tag-bg-full)] border-none",
        onClick && "select-none",
        className
      )}
      size={size}
      style={style}
      onClick={onClick}
    >
      {getIcon()}
      {tag.displayName}
    </Badge>
  );
};
