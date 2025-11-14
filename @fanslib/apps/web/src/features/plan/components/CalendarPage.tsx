import { useCallback, useEffect, useMemo, useState } from "react";
import type { Post } from "@fanslib/types";
import { PostFilters } from "./PostFilters";
import { PageHeader } from "~/components/ui/PageHeader";
import { SectionHeader } from "~/components/ui/SectionHeader";
import { usePlanPreferences } from "~/contexts/PlanPreferencesContext";
import { useScrollPosition } from "~/hooks/useScrollPosition";
import { useChannelsQuery } from "~/lib/queries/channels";
import { usePostsQuery } from "~/lib/queries/posts";
import { useContentSchedulesQuery } from "~/lib/queries/content-schedules";
import { generateVirtualPosts, isVirtualPost, type VirtualPost } from "~/lib/virtual-posts";
import { PlanEmptyState } from "./PlanEmptyState";
import { PlanViewSettings } from "./PlanViewSettings";
import { PostCalendar } from "./PostCalendar/PostCalendar";
import { PostTimeline } from "./PostTimeline";
import { ViewNavigationToggle } from "~/components/ViewNavigationToggle";

const CalendarPageContent = () => {
  const { data: channels = [] } = useChannelsQuery();
  const { preferences, updatePreferences } = usePlanPreferences();
  const [posts, setPosts] = useState<(Post | VirtualPost)[]>([]);
  const [isPostsLoaded, setIsPostsLoaded] = useState(false);

  const shouldRestoreScroll = preferences.view.viewType === "calendar" && isPostsLoaded;
  const scrollRef = useScrollPosition<HTMLDivElement>(shouldRestoreScroll);

  const filtersQuery = useMemo(() => {
    if (!preferences.filter) return undefined;
    return JSON.stringify(preferences.filter);
  }, [preferences.filter]);

  const allPostsFiltersQuery = useMemo(() => {
    if (!preferences.filter?.dateRange) return undefined;
    return JSON.stringify({
      dateRange: preferences.filter.dateRange,
    });
  }, [preferences.filter?.dateRange]);

  const { data: filteredPosts = [], refetch: refetchFilteredPosts } = usePostsQuery({
    filters: filtersQuery,
  });

  const { data: allPosts = [], refetch: refetchAllPosts } = usePostsQuery({
    filters: allPostsFiltersQuery,
  });

  const { data: schedules = [], refetch: refetchSchedules } = useContentSchedulesQuery();

  const fetchPosts = useCallback(async () => {
    setIsPostsLoaded(false);
    try {
      await Promise.all([refetchFilteredPosts(), refetchAllPosts(), refetchSchedules()]);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  }, [refetchFilteredPosts, refetchAllPosts, refetchSchedules]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    const shouldShowDraftPosts =
      !preferences.filter.statuses || preferences.filter.statuses.includes("draft");

    const virtualPosts = shouldShowDraftPosts
      ? generateVirtualPosts(
          schedules.filter(
            (s) =>
              !preferences.filter.channels || preferences.filter.channels?.includes(s.channel.id)
          ),
          allPosts
        )
      : [];

    const allPostsCombined = [...filteredPosts, ...virtualPosts].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    setPosts(allPostsCombined);
    setIsPostsLoaded(true);
  }, [filteredPosts, allPosts, schedules, preferences.filter]);

  const refetchPosts = useCallback(async () => {
    await fetchPosts();
  }, [fetchPosts]);

  return (
    <>
      <div className="h-full w-full overflow-hidden flex flex-col">
        <PageHeader
          title="Plan"
          description="Schedule and organize your content publication timeline"
          className="py-6 pl-6 pr-4 flex-none"
        />
        <div className="px-6 pb-4">
          <SectionHeader title="" actions={<PlanViewSettings />} />
          <div className="mt-2">
            <PostFilters
              value={preferences.filter}
              onFilterChange={(filter) => {
                updatePreferences({ filter });
              }}
            />
          </div>
        </div>
        <div className="flex-1 overflow-hidden px-6">
          {!channels.length && <PlanEmptyState />}
          {channels.length && preferences.view.viewType === "timeline" && (
            <PostTimeline posts={posts} onUpdate={refetchPosts} />
          )}
          {channels.length && preferences.view.viewType === "calendar" && (
            <PostCalendar posts={posts} onUpdate={refetchPosts} scrollRef={scrollRef} />
          )}
        </div>
      </div>
      <ViewNavigationToggle
        position="left"
        to="/content/schedule"
        label="Go to schedule view"
      />
    </>
  );
};

export const CalendarPage = () => {
  return <CalendarPageContent />;
};

