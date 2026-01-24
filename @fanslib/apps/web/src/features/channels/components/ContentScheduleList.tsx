import type { ContentScheduleWithChannelSchema } from "@fanslib/server/schemas";
import { Edit, Trash2 } from "lucide-react";
import { ContentScheduleBadge } from "~/components/ContentScheduleBadge";
import { MediaFilterSummary } from "~/components/MediaFilterSummary";
import { Button } from "~/components/ui/Button/Button";
import { useDeleteContentScheduleMutation } from "~/lib/queries/content-schedules";
import { parseMediaFilters } from "../content-schedule-helpers";

type ContentSchedule = typeof ContentScheduleWithChannelSchema.static;

type ContentScheduleListProps = {
  schedules: ContentSchedule[];
  onEdit: (schedule: ContentSchedule) => void;
};

export const ContentScheduleList = ({ schedules, onEdit }: ContentScheduleListProps) => {
  const deleteSchedule = useDeleteContentScheduleMutation();

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;

    try {
      await deleteSchedule.mutateAsync(id);
    } catch (error) {
      console.error("Failed to delete schedule:", error);
    }
  };

  const formatScheduleType = (type: string) =>
    type.charAt(0).toUpperCase() + type.slice(1);

  if (schedules.length === 0) {
    return (
      <div className="text-center py-8 text-base-content/60">
        No content schedules configured. Add one to get started.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {schedules.map((schedule) => {
        const mediaFilters = parseMediaFilters(schedule.mediaFilters);

        return (
          <div
            key={schedule.id}
            className="card bg-base-200 p-4 flex flex-row items-start justify-between gap-4"
          >
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <ContentScheduleBadge
                  name={schedule.name}
                  emoji={schedule.emoji}
                  color={schedule.color}
                  responsive={false}
                />
                <span className="badge badge-ghost">
                  {formatScheduleType(schedule.type)}
                </span>
                {schedule.postsPerTimeframe && (
                  <span className="text-sm text-base-content/70">
                    {schedule.postsPerTimeframe} posts per {schedule.type === "daily" ? "day" : schedule.type === "weekly" ? "week" : "month"}
                  </span>
                )}
              </div>

              {schedule.preferredDays && schedule.preferredDays.length > 0 && (
                <div className="text-sm">
                  <span className="font-medium">Preferred days:</span>{" "}
                  <span className="text-base-content/70">
                    {schedule.preferredDays.join(", ")}
                  </span>
                </div>
              )}

              {schedule.preferredTimes && schedule.preferredTimes.length > 0 && (
                <div className="text-sm">
                  <span className="font-medium">Preferred times:</span>{" "}
                  <span className="text-base-content/70">
                    {schedule.preferredTimes.join(", ")}
                  </span>
                </div>
              )}

              {mediaFilters && (
                <div className="text-sm">
                  <MediaFilterSummary mediaFilters={mediaFilters} />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onPress={() => onEdit(schedule)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => handleDelete(schedule.id)}
                isDisabled={deleteSchedule.isPending}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
