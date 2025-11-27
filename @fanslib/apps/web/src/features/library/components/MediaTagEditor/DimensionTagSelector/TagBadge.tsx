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
  const badgeVariant = selectionState === "unchecked" ? variant : "neutral";
  const colorDef = getColorDefinitionFromString(tag.color, tag.id);
  const style = {
    "--tag-bg-full": colorDef.background,
    "--tag-bg-muted": `color-mix(in oklch, ${colorDef.background} 15%, transparent)`,
    "--tag-bg-selected": `color-mix(in oklch, ${colorDef.background} 80%, transparent)`,
    "--tag-border": `color-mix(in oklch, ${colorDef.background} 30%, transparent)`,
    borderColor: "var(--tag-border)",
    color: colorDef.foreground,
  } as CSSProperties;

  const isSelected = selectionState === "checked" || selectionState === "indeterminate";
  const backgroundClass = isSelected
    ? "bg-[color:var(--tag-bg-selected)] hover:bg-[color:var(--tag-bg-full)]"
    : "bg-[color:var(--tag-bg-muted)] hover:bg-[color:var(--tag-bg-full)]";

  return (
    <Badge
      variant={badgeVariant}
      className={cn(
        "cursor-pointer flex items-center gap-1 border",
        backgroundClass,
        onClick && "select-none",
        className
      )}
      size={size}
      style={style}
      onClick={onClick}
    >
      {tag.displayName}
    </Badge>
  );
};
