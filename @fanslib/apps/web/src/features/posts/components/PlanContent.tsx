import type { PostWithRelations } from "@fanslib/server/schemas";
import { addWeeks, endOfDay, startOfWeek, subWeeks } from "date-fns";
import { de } from "date-fns/locale";
import { useCallback, useMemo, useRef, useState } from "react";
import { SectionHeader } from "~/components/ui/SectionHeader";
import { usePostPreferences } from "~/contexts/PostPreferencesContext";
import { useChannelsQuery } from "~/lib/queries/channels";
import {
  useContentSchedulesQuery,
  useVirtualPostsQuery,
} from "~/lib/queries/content-schedules";
import { usePostsQuery } from "~/lib/queries/posts";
import { filterPostsByType } from "~/lib/virtual-posts";
import { PlanEmptyState } from "./PlanEmptyState";
import { PlanViewSettings } from "./PlanViewSettings";
import { PostCalendar, type PostCalendarHandle } from "./PostCalendar/PostCalendar";
import { PostFilters } from "./PostFilters";

type Post = PostWithRelations;

type DateRange = { startDate: Date; endDate: Date };

const computeInitialRange = (): DateRange => {
  const weekStart = startOfWeek(new Date(), { locale: de });
  return {
    startDate: subWeeks(weekStart, 1),
    endDate: endOfDay(addWeeks(weekStart, 3)),
  };
};

type PlanContentProps = {
  initialRange?: DateRange;
};

export const PlanContent = ({ initialRange }: PlanContentProps) => {
  const { data: channels = [] } = useChannelsQuery();
  const { preferences, updatePreferences } = usePostPreferences();
  const calendarRef = useRef<PostCalendarHandle>(null);

  const [visibleRange, setVisibleRange] = useState<DateRange>(
    () => initialRange ?? computeInitialRange()
  );

  const handleVisibleRangeChange = useCallback(
    (startDate: Date, endDate: Date) => {
      setVisibleRange((prev) => {
        const expandedStart =
          startDate.getTime() < prev.startDate.getTime()
            ? startDate
            : prev.startDate;
        const expandedEnd =
          endDate.getTime() > prev.endDate.getTime()
            ? endDate
            : prev.endDate;

        if (expandedStart === prev.startDate && expandedEnd === prev.endDate)
          return prev;
        return { startDate: expandedStart, endDate: expandedEnd };
      });
    },
    []
  );

  const filtersQuery = useMemo(() => {
    const baseFilter = preferences.filter ? { ...preferences.filter } : {};
    return JSON.stringify({
      ...baseFilter,
      dateRange: {
        startDate: visibleRange.startDate.toISOString(),
        endDate: visibleRange.endDate.toISOString(),
      },
    });
  }, [preferences.filter, visibleRange]);

  const {
    data: filteredPosts = [],
    refetch: refetchFilteredPosts,
    isFetching: isPostsFetching,
  } = usePostsQuery({ filters: filtersQuery });

  const { data: schedules, refetch: refetchSchedules } =
    useContentSchedulesQuery();

  const channelIds = useMemo(() => {
    if (preferences.filter?.channels?.length) {
      return preferences.filter.channels;
    }
    const ids = (schedules ?? []).flatMap((schedule) => {
      if (schedule.scheduleChannels?.length) {
        return schedule.scheduleChannels.map((sc) => sc.channel.id);
      }
      if (schedule.channel) {
        return [schedule.channel.id];
      }
      return [];
    });
    return [...new Set(ids)];
  }, [preferences.filter?.channels, schedules]);

  const {
    data: virtualPosts = [],
    refetch: refetchVirtualPosts,
    isFetching: isVirtualPostsFetching,
  } = useVirtualPostsQuery({
    channelIds,
    fromDate: visibleRange.startDate,
    toDate: visibleRange.endDate,
  });

  const refetchAll = useCallback(
    () =>
      Promise.all([
        refetchFilteredPosts(),
        refetchSchedules(),
        refetchVirtualPosts(),
      ]).then(() => undefined),
    [refetchFilteredPosts, refetchSchedules, refetchVirtualPosts]
  );

  const posts = useMemo(() => {
    const shouldShowDraftPosts =
      !preferences.filter.statuses ||
      preferences.filter.statuses.includes("draft");

    const visibleVirtualPosts = shouldShowDraftPosts ? virtualPosts : [];

    const allPostsCombined = [
      ...(filteredPosts ?? []),
      ...visibleVirtualPosts,
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return filterPostsByType(
      allPostsCombined as unknown as Post[],
      preferences.view.postTypeFilter
    );
  }, [
    filteredPosts,
    virtualPosts,
    preferences.filter.statuses,
    preferences.view.postTypeFilter,
  ]);

  const isLoading = isPostsFetching || isVirtualPostsFetching;

  return (
    <div className="h-full overflow-hidden flex flex-col max-w-[1200px] mx-auto">
      <div className="px-6 pb-3 flex-shrink-0">
        <SectionHeader title="" actions={<PlanViewSettings />} />
        <div className="mt-2 flex items-center gap-2">
          <PostFilters
            value={preferences.filter}
            onFilterChange={(filter) => {
              updatePreferences({ filter });
            }}
          />
        </div>
      </div>
      <div className="flex-1 min-h-0 pl-20 pr-6">
        {!channels?.length && <PlanEmptyState />}
        {(channels?.length ?? 0) > 0 && (
          <PostCalendar
            ref={calendarRef}
            posts={posts}
            onUpdate={refetchAll}
            onVisibleRangeChange={handleVisibleRangeChange}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
};
