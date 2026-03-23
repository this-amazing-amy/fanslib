import { ChannelBadge } from "~/components/ChannelBadge";
import { ContentScheduleBadge } from "~/components/ContentScheduleBadge";
import type { useContentSchedulesQuery } from "~/lib/queries/content-schedules";
import { useScheduleHover } from "./ScheduleHoverContext";

type Schedule = NonNullable<ReturnType<typeof useContentSchedulesQuery>["data"]>[number];

type ScheduleCardProps = {
  schedule: Schedule;
};

const formatCadence = (schedule: Schedule): string => {
  const count = schedule.postsPerTimeframe;
  if (!count) return schedule.type;

  const timeframeLabel =
    schedule.type === "daily" ? "day" : schedule.type === "weekly" ? "week" : "month";

  if (count === 1) return `1 post / ${timeframeLabel}`;
  return `${count} posts / ${timeframeLabel}`;
};

export const ScheduleCard = ({ schedule }: ScheduleCardProps) => {
  const cadence = formatCadence(schedule);
  const { setHoveredScheduleId } = useScheduleHover();

  return (
    <div
      className="p-3 space-y-2"
      onMouseEnter={() => setHoveredScheduleId(schedule.id)}
      onMouseLeave={() => setHoveredScheduleId(null)}
    >
      <div className="flex items-center gap-2">
        <ContentScheduleBadge
          name={schedule.name}
          emoji={schedule.emoji}
          color={schedule.color}
          size="sm"
        />
      </div>

      <div className="text-xs text-base-content/60">{cadence}</div>

      {schedule.scheduleChannels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {schedule.scheduleChannels.map((sc) => (
            <ChannelBadge
              key={sc.id}
              name={sc.channel.name}
              typeId={sc.channel.typeId}
              size="sm"
              borderStyle="none"
            />
          ))}
        </div>
      )}
    </div>
  );
};
