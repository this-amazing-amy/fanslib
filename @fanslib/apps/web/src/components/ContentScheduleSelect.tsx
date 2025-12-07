import type { ContentScheduleWithChannelSchema } from "@fanslib/server/schemas";
import { cn } from "~/lib/cn";
import { useContentSchedulesQuery } from "~/lib/queries/content-schedules";
import { ContentScheduleBadge } from "./ContentScheduleBadge";

type ContentSchedule = typeof ContentScheduleWithChannelSchema.static;

type ContentScheduleSelectProps = {
  value?: string | null;
  onChange: (value: string | null) => void;
  channelId?: string;
  className?: string;
};

export const ContentScheduleSelect = ({
  value,
  onChange,
  channelId,
  className,
}: ContentScheduleSelectProps) => {
  const { data: allSchedules = [] } = useContentSchedulesQuery();

  const schedules = channelId
    ? (allSchedules ?? []).filter((s) => s.channelId === channelId)
    : (allSchedules ?? []);

  const handleToggleSchedule = (scheduleId: string) => {
    if (value === scheduleId) {
      onChange(null);
    } else {
      onChange(scheduleId);
    }
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {(schedules ?? []).length === 0 && (
        <div className="text-sm text-base-content/60">
          {channelId
            ? "No schedules configured for this channel."
            : "No content schedules found."}
        </div>
      )}

      {(schedules ?? []).map((schedule) => {
        const isSelected = value === schedule.id;

        return (
          <button
            key={schedule.id}
            type="button"
            onClick={() => handleToggleSchedule(schedule.id)}
            className={cn(
              "transition-all",
              isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-base-100"
            )}
          >
            <ContentScheduleBadge
              name={schedule.name}
              emoji={schedule.emoji}
              color={schedule.color}
            />
          </button>
        );
      })}
    </div>
  );
};
