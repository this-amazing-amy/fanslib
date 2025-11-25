import { Check, Clock, Edit2Icon } from "lucide-react";
import { POST_STATUS_COLORS } from "~/lib/colors";

type StatusIconProps = {
  status: "posted" | "scheduled" | "draft";
};

const STATUS_CONFIG = {
  posted: {
    Icon: Check,
    color: POST_STATUS_COLORS.posted.foreground,
    background: POST_STATUS_COLORS.posted.background,
  },
  scheduled: {
    Icon: Clock,
    color: POST_STATUS_COLORS.scheduled.foreground,
    background: POST_STATUS_COLORS.scheduled.background,
  },
  draft: {
    Icon: Edit2Icon,
    color: POST_STATUS_COLORS.draft.foreground,
    background: POST_STATUS_COLORS.draft.background,
  },
} as const;

export const StatusIcon = ({ status }: StatusIconProps) => {
  const config = STATUS_CONFIG[status];
  const Icon = config.Icon;

  return (
    <div
      className="flex items-center justify-center rounded-full w-5 h-5"
      style={{
        backgroundColor: config.background,
      }}
    >
      <Icon
        className="w-3 h-3"
        style={{
          color: config.color,
        }}
      />
    </div>
  );
};
