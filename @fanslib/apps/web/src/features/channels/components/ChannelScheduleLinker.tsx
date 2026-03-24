import { Link } from "@tanstack/react-router";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { ContentScheduleBadge } from "~/components/ContentScheduleBadge";
import {
  useContentSchedulesByChannelQuery,
  useContentSchedulesQuery,
  useLinkChannelToScheduleMutation,
  useUnlinkChannelFromScheduleMutation,
} from "~/lib/queries/content-schedules";

type ChannelScheduleLinkerProps = {
  channelId: string;
};

export const ChannelScheduleLinker = ({ channelId }: ChannelScheduleLinkerProps) => {
  const { data: linkedSchedules = [], isLoading } = useContentSchedulesByChannelQuery(channelId);
  const { data: allSchedules = [] } = useContentSchedulesQuery();
  const linkMutation = useLinkChannelToScheduleMutation();
  const unlinkMutation = useUnlinkChannelFromScheduleMutation();
  const [showDropdown, setShowDropdown] = useState(false);

  const linkedIds = new Set(linkedSchedules.map((s) => s.id));
  const unlinkableSchedules = allSchedules.filter((s) => !linkedIds.has(s.id));

  const handleLink = async (scheduleId: string) => {
    await linkMutation.mutateAsync({ scheduleId, channelId });
    setShowDropdown(false);
  };

  if (isLoading) {
    return <div className="text-base-content/60">Loading schedules...</div>;
  }

  if (linkedSchedules.length === 0 && !showDropdown) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-base-content/60">
          No schedules linked. Link an existing schedule or create one on the Schedules page.
        </div>
        {unlinkableSchedules.length > 0 && (
          <div className="relative">
            <button
              className="btn btn-ghost btn-sm gap-1"
              aria-label="Link Schedule"
              onClick={() => setShowDropdown(true)}
            >
              <Plus className="w-4 h-4" />
              Link Schedule
            </button>
            {showDropdown && (
              <ScheduleDropdown
                schedules={unlinkableSchedules}
                onSelect={handleLink}
              />
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        {linkedSchedules.map((schedule) => (
          <div key={schedule.id} className="flex items-center gap-1">
            <Link to="/schedules/$id" params={{ id: schedule.id }}>
              <ContentScheduleBadge
                name={schedule.name}
                emoji={schedule.emoji}
                color={schedule.color}
              />
            </Link>
            <button
              className="btn btn-ghost btn-xs p-0"
              aria-label={`Unlink ${schedule.name}`}
              onClick={() =>
                unlinkMutation.mutateAsync({
                  scheduleId: schedule.id,
                  channelId,
                })
              }
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {unlinkableSchedules.length > 0 && (
          <div className="relative">
            <button
              className="btn btn-ghost btn-sm gap-1"
              aria-label="Link Schedule"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <Plus className="w-4 h-4" />
              Link Schedule
            </button>
            {showDropdown && (
              <ScheduleDropdown
                schedules={unlinkableSchedules}
                onSelect={handleLink}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ScheduleDropdown = ({
  schedules,
  onSelect,
}: {
  schedules: Array<{ id: string; name: string; emoji: string | null; color: string | null }>;
  onSelect: (id: string) => void;
}) => (
  <div className="absolute z-10 mt-1 w-64 rounded-lg border border-base-300 bg-base-100 shadow-lg p-1">
    {schedules.map((schedule) => (
      <button
        key={schedule.id}
        className="w-full text-left px-3 py-2 rounded-md hover:bg-base-200 flex items-center gap-2"
        onClick={() => onSelect(schedule.id)}
      >
        <ContentScheduleBadge
          name={schedule.name}
          emoji={schedule.emoji}
          color={schedule.color}
          size="sm"
        />
      </button>
    ))}
    {schedules.length === 0 && (
      <div className="px-3 py-2 text-sm text-base-content/60">No available schedules</div>
    )}
  </div>
);
