import { Badge } from "~/components/Badge";

const RATING_COLORS: Record<string, { bg: string; fg: string }> = {
  xt: { bg: "oklch(82% 0.12 15)", fg: "oklch(35% 0.15 15)" },
  uc: { bg: "oklch(84% 0.12 300)", fg: "oklch(35% 0.15 300)" },
  cn: { bg: "oklch(95% 0.12 95)", fg: "oklch(45% 0.12 95)" },
  sg: { bg: "oklch(85% 0.10 230)", fg: "oklch(35% 0.12 230)" },
  sf: { bg: "oklch(85% 0.10 145)", fg: "oklch(35% 0.12 145)" },
};

type ContentRatingBadgeProps = {
  rating: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export const ContentRatingBadge = ({ rating, size = "sm", className }: ContentRatingBadgeProps) => {
  const colors = RATING_COLORS[rating] ?? RATING_COLORS.sf;
  return (
    <Badge
      label={rating.toUpperCase()}
      size={size}
      selected
      responsive={false}
      backgroundColor={colors.bg}
      foregroundColor={colors.fg}
      className={className}
    />
  );
};
