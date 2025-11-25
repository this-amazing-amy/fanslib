import { cn } from "~/lib/cn";
import { DEFAULT_SCHEDULE_COLOR, getColorDefinitionFromString } from "~/lib/colors";

type ContentScheduleBadgeProps = {
  name: string;
  emoji?: string | null;
  color?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export const ContentScheduleBadge = ({
  name,
  emoji,
  color = DEFAULT_SCHEDULE_COLOR,
  size = "lg",
  className,
}: ContentScheduleBadgeProps) => {
  const colorDef = getColorDefinitionFromString(color, 0);
  const bgColor = colorDef.background;
  const foregroundColor = colorDef.foreground;

  return (
    <div
      className={cn(
        "rounded-full font-medium flex items-center border",
        {
          "px-1.5 py-0.5 text-[10px] gap-1 leading-tight": size === "sm",
          "px-2 py-0.5 text-xs gap-1.5": size === "md",
          "px-2.5 py-1 text-sm gap-1.5": size === "lg",
        },
        className
      )}
      style={{
        backgroundColor: bgColor,
        borderColor: foregroundColor,
        color: foregroundColor,
      }}
    >
      {emoji && <span>{emoji}</span>}
      <span className={cn({ "truncate max-w-[60px]": size === "sm" })}>{name}</span>
    </div>
  );
};
