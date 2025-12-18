import { cn } from "~/lib/cn";
import { useContentSchedulesQuery } from "~/lib/queries/content-schedules";
import { ContentScheduleBadge } from "./ContentScheduleBadge";

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
          <ContentScheduleBadge
            key={schedule.id}
            name={schedule.name}
            emoji={schedule.emoji}
            color={schedule.color}
            selected={isSelected}
            selectable
            onSelectionChange={() => handleToggleSchedule(schedule.id)}
            className={cn("transition-all")}
          />
        );
      })}
    </div>
  );
};
