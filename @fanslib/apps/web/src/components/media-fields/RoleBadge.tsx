import { Badge } from "~/components/Badge";
import { getColorDefinitionFromString } from "~/lib/colors";

type RoleBadgeProps = {
  role: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export const RoleBadge = ({ role, size = "sm", className }: RoleBadgeProps) => {
  const colors = getColorDefinitionFromString("preset:lime", 0);
  return (
    <Badge
      label={role}
      size={size}
      selected
      responsive={false}
      backgroundColor={colors.background}
      foregroundColor={colors.foreground}
      className={className}
    />
  );
};
