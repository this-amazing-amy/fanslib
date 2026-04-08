import { Badge } from "~/components/Badge";
import { getColorDefinitionFromString } from "~/lib/colors";

type PackageBadgeProps = {
  pkg: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export const PackageBadge = ({ pkg, size = "sm", className }: PackageBadgeProps) => {
  const colors = getColorDefinitionFromString("preset:periwinkle", 0);
  return (
    <Badge
      label={pkg}
      size={size}
      selected
      responsive={false}
      backgroundColor={colors.background}
      foregroundColor={colors.foreground}
      className={className}
    />
  );
};
