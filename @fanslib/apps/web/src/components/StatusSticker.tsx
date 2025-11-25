import { Check, Clock, Edit2Icon } from "lucide-react";
import { cn } from "~/lib/cn";
import { POST_STATUS_COLORS } from "~/lib/colors";

type StatusStickerProps = {
  status: "posted" | "scheduled" | "draft";
  size?: "sm" | "md" | "lg";
  className?: string;
};

const STATUS_CONFIG = {
  posted: {
    label: "Posted",
    background: POST_STATUS_COLORS.posted.background,
    foreground: POST_STATUS_COLORS.posted.foreground,
    Icon: Check,
  },
  scheduled: {
    label: "Scheduled",
    background: POST_STATUS_COLORS.scheduled.background,
    foreground: POST_STATUS_COLORS.scheduled.foreground,
    Icon: Clock,
  },
  draft: {
    label: "Draft",
    background: POST_STATUS_COLORS.draft.background,
    foreground: POST_STATUS_COLORS.draft.foreground,
    Icon: Edit2Icon,
  },
} as const;

export const StatusSticker = ({ status, size = "sm", className }: StatusStickerProps) => {
  const config = STATUS_CONFIG[status];

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
        backgroundColor: config.background,
        borderColor: config.foreground,
        color: config.foreground,
      }}
    >
      <config.Icon className={cn(size === "sm" ? "h-2.5 w-2.5" : size === "md" ? "h-3 w-3" : "h-3.5 w-3.5")} />
      <span>{config.label}</span>
    </div>
  );
};
