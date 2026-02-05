import type { PostWithRelations } from '@fanslib/server/schemas';
import { addMonths, endOfMonth, startOfMonth } from "date-fns";
import { CalendarDays } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "~/components/ui/Button";
import { SectionHeader } from "~/components/ui/SectionHeader";
import { usePostPreferences } from "~/contexts/PostPreferencesContext";
import { useChannelsQuery } from "~/lib/queries/channels";
import { useContentSchedulesQuery, useVirtualPostsQuery } from "~/lib/queries/content-schedules";
import { usePostsQuery } from "~/lib/queries/posts";
import { filterPostsByType } from "~/lib/virtual-posts";
import { PlanEmptyState } from "./PlanEmptyState";
import { PlanViewSettings } from "./PlanViewSettings";
import { PostCalendar, type PostCalendarHandle } from "./PostCalendar/PostCalendar";
import { PostFilters } from "./PostFilters";

type Post = PostWithRelations;

export const PlanContent = () => {
  const { data: channels = [] } = useChannelsQuery();
  const { preferences, updatePreferences } = usePostPreferences();
  const calendarRef = useRef<PostCalendarHandle>(null);
  
  // Track the visible date range from the calendar for fetching
  const [visibleRange, setVisibleRange] = useState(() => ({
    startDate: addMonths(startOfMonth(new Date()), -1),
    endDate: addMonths(startOfMonth(new Date()), 3),
  }));

  // Debounce visible range changes to avoid too many fetches
  const visibleRangeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const handleVisibleRangeChange = useCallback((startDate: Date, endDate: Date) => {
    if (visibleRangeTimeoutRef.current) {
      clearTimeout(visibleRangeTimeoutRef.current);
    }
    
    visibleRangeTimeoutRef.current = setTimeout(() => {
      setVisibleRange((prev) => {
        // Only update if the range has actually changed significantly
        const prevStart = prev.startDate.getTime();
        const prevEnd = prev.endDate.getTime();
        const newStart = startDate.getTime();
        const newEnd = endDate.getTime();
        
        // Expand the range if new dates fall outside current range
        const expandedStart = newStart < prevStart ? startDate : prev.startDate;
        const expandedEnd = newEnd > prevEnd ? endDate : prev.endDate;
        
        if (expandedStart !== prev.startDate || expandedEnd !== prev.endDate) {
          return { startDate: expandedStart, endDate: expandedEnd };
        }
        return prev;
      });
    }, 200);
  }, []);

  // Build filters for the posts query using visible range
  const filtersQuery = useMemo(() => {
    const baseFilter = preferences.filter ? { ...preferences.filter } : {};
    // Override date range with the expanded visible range
    return JSON.stringify({
      ...baseFilter,
      dateRange: {
        startDate: visibleRange.startDate.toISOString(),
        endDate: endOfMonth(visibleRange.endDate).toISOString(),
      },
    });
  }, [preferences.filter, visibleRange]);

  const { data: filteredPosts = [], refetch: refetchFilteredPosts, isFetching: isPostsFetching } = usePostsQuery({
    filters: filtersQuery,
  });

  const { data: schedules, refetch: refetchSchedules } = useContentSchedulesQuery();

  const channelIds = useMemo(() => {
    if (preferences.filter?.channels?.length) {
      return preferences.filter.channels;
    }
    return (schedules ?? []).map((schedule) => (schedule.channel as { id: string }).id);
  }, [preferences.filter?.channels, schedules]);

  const { data: virtualPosts = [], refetch: refetchVirtualPosts, isFetching: isVirtualPostsFetching } = useVirtualPostsQuery({
    channelIds,
    fromDate: visibleRange.startDate,
    toDate: visibleRange.endDate,
  });

  const fetchPosts = useCallback(async () => {
    try {
      await Promise.all([refetchFilteredPosts(), refetchSchedules(), refetchVirtualPosts()]);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  }, [refetchFilteredPosts, refetchSchedules, refetchVirtualPosts]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Derive posts from filtered posts + virtual posts (no useState needed)
  const posts = useMemo(() => {
    const shouldShowDraftPosts =
      !preferences.filter.statuses || preferences.filter.statuses.includes("draft");

    const visibleVirtualPosts = shouldShowDraftPosts ? virtualPosts : [];

    const allPostsCombined = [...(filteredPosts ?? []), ...visibleVirtualPosts].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return filterPostsByType(allPostsCombined as unknown as Post[], preferences.view.postTypeFilter);
  }, [filteredPosts, virtualPosts, preferences.filter.statuses, preferences.view.postTypeFilter]);

  const refetchPosts = useCallback(async () => {
    await fetchPosts();
  }, [fetchPosts]);

  const isLoading = isPostsFetching || isVirtualPostsFetching;

  const jumpToToday = () => {
    calendarRef.current?.scrollToToday();
  };

  return (
    <div className="h-full overflow-hidden flex flex-col max-w-[1200px] mx-auto">
      <div className="px-6 pb-4 flex-shrink-0">
        <SectionHeader
          title=""
          actions={<PlanViewSettings />}
        />
        <div className="mt-2 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onPress={jumpToToday}
            className="h-9 w-9"
            aria-label="Jump to today"
          >
            <CalendarDays className="h-4 w-4" />
          </Button>
          <PostFilters
            value={preferences.filter}
            onFilterChange={(filter) => {
              updatePreferences({ filter });
            }}
          />
        </div>
      </div>
      <div className="flex-1 min-h-0 pl-6 overflow-y-auto">
        {!(channels?.length) && <PlanEmptyState />}
        {(channels?.length ?? 0) > 0 && (
          <PostCalendar
            ref={calendarRef}
            posts={posts} 
            onUpdate={refetchPosts} 
            onVisibleRangeChange={handleVisibleRangeChange}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
};

