import { useMemo } from "react";
import { ContentScheduleBadge } from "~/components/ContentScheduleBadge";
import { MediaFilterSummary } from "~/components/MediaFilterSummary";
import { parseMediaFilters } from "~/features/channels/content-schedule-helpers";
import { useVirtualPostsQuery } from "~/lib/queries/content-schedules";

type ScheduleBreakdownProps = {
  selectedChannelIds: string[];
  schedules: Array<{
    id: string;
    name: string;
    emoji: string | null;
    color: string | null;
    channelId: string;
    mediaFilters: string | null;
    type: "daily" | "weekly" | "monthly";
    postsPerTimeframe: number | null;
    preferredDays: string[] | null;
    preferredTimes: string[] | null;
    skippedSlots?: Array<{ date: string }>;
  }>;
  fromDate: Date;
  toDate: Date;
};

export const ScheduleBreakdown = ({
  selectedChannelIds,
  schedules,
  fromDate,
  toDate,
}: ScheduleBreakdownProps) => {
  const relevantSchedules = useMemo(
    () => schedules.filter((schedule) => selectedChannelIds.includes(schedule.channelId)),
    [schedules, selectedChannelIds]
  );

  const { data: virtualPosts = [] } = useVirtualPostsQuery({
    channelIds: selectedChannelIds,
    fromDate,
    toDate,
  });

  const scheduleDraftCounts = useMemo(
    () =>
      virtualPosts.reduce<Record<string, number>>(
        (acc, post) =>
          post.scheduleId
            ? {
                ...acc,
                [post.scheduleId]: (acc[post.scheduleId] ?? 0) + 1,
              }
            : acc,
        {}
      ),
    [virtualPosts]
  );

  if (selectedChannelIds.length === 0 || relevantSchedules.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">Content schedules</div>
      <div className="grid grid-cols-[auto_auto_1fr] items-center gap-x-4 gap-y-3">
        {relevantSchedules.flatMap((schedule) => {
          const mediaFilters = parseMediaFilters(schedule.mediaFilters);
          const draftCount = scheduleDraftCounts[schedule.id] ?? 0;
          return [
            <div key={`${schedule.id}-count`} className="text-2xl font-bold text-base-content">
              {draftCount}
            </div>,
            <ContentScheduleBadge
              key={`${schedule.id}-badge`}
              name={schedule.name}
              emoji={schedule.emoji}
              color={schedule.color}
              size="sm"
              borderStyle="none"
              selected
              responsive={false}
            />,
            mediaFilters && mediaFilters.length > 0 ? (
              <div key={`${schedule.id}-filters`}>
                <MediaFilterSummary mediaFilters={mediaFilters} />
              </div>
            ) : (
              <div key={`${schedule.id}-no-filters`} className="text-xs text-base-content/40">
                No filters (all media eligible)
              </div>
            ),
          ];
        })}
      </div>
    </div>
  );
};
