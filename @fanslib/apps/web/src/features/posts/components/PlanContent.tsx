import type { PostWithRelationsSchema } from "@fanslib/server/schemas";
import { addMonths } from "date-fns";
import { CalendarDays, Columns3, LayoutList } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ToggleGroup } from "~/components/ui/ToggleGroup";
import { SectionHeader } from "~/components/ui/SectionHeader";
import { usePostPreferences, type PostViewType } from "~/contexts/PostPreferencesContext";
import { useChannelsQuery } from "~/lib/queries/channels";
import { useContentSchedulesQuery, useVirtualPostsQuery } from "~/lib/queries/content-schedules";
import { usePostsQuery } from "~/lib/queries/posts";
import { filterPostsByType } from "~/lib/virtual-posts";
import { PlanEmptyState } from "./PlanEmptyState";
import { PlanViewSettings } from "./PlanViewSettings";
import { PostCalendar } from "./PostCalendar/PostCalendar";
import { PostFilters } from "./PostFilters";
import { PostSwimlane, SwimlaneHiddenChannelsDropdown } from "./PostSwimlane";
import { PostTimeline } from "./PostTimeline";

type Post = typeof PostWithRelationsSchema.static;

export const PlanContent = () => {
  const { data: channels = [] } = useChannelsQuery();
  const { preferences, updatePreferences } = usePostPreferences();
  const [posts, setPosts] = useState<Post[]>([]);

  const filtersQuery = useMemo(() => {
    if (!preferences.filter) return undefined;
    return JSON.stringify(preferences.filter);
  }, [preferences.filter]);

  const { data: filteredPosts = [], refetch: refetchFilteredPosts } = usePostsQuery({
    filters: filtersQuery,
  });

  const { data: schedules, refetch: refetchSchedules } = useContentSchedulesQuery();

  const channelIds = useMemo(() => {
    if (preferences.filter?.channels?.length) {
      return preferences.filter.channels;
    }
    return (schedules ?? []).map((schedule) => (schedule.channel as { id: string }).id);
  }, [preferences.filter?.channels, schedules]);

  const fromDate = useMemo(() => {
    const start = preferences.filter?.dateRange?.startDate;
    return start ? new Date(start) : new Date();
  }, [preferences.filter?.dateRange?.startDate]);

  const toDate = useMemo(() => {
    const end = preferences.filter?.dateRange?.endDate;
    return end ? new Date(end) : addMonths(fromDate, 1);
  }, [preferences.filter?.dateRange?.endDate, fromDate]);

  const { data: virtualPosts = [], refetch: refetchVirtualPosts } = useVirtualPostsQuery({
    channelIds,
    fromDate,
    toDate,
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

  useEffect(() => {
    const shouldShowDraftPosts =
      !preferences.filter.statuses || preferences.filter.statuses.includes("draft");

    const visibleVirtualPosts = shouldShowDraftPosts ? virtualPosts : [];

    const allPostsCombined = [...(filteredPosts ?? []), ...visibleVirtualPosts].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const filteredByType = filterPostsByType(allPostsCombined, preferences.view.postTypeFilter);

    setPosts(filteredByType);
  }, [filteredPosts, virtualPosts, preferences.filter, preferences.view.postTypeFilter]);

  const refetchPosts = useCallback(async () => {
    await fetchPosts();
  }, [fetchPosts]);

  return (
    <div className="h-full w-full overflow-hidden flex flex-col">
      <div className="px-6 pb-4">
        <SectionHeader
          title=""
          actions={
            <div className="flex items-center gap-2">
              <ToggleGroup
                value={preferences.view.viewType}
                aria-label="Plan view type"
                onChange={(value) => {
                  if (!value) return;
                  updatePreferences({ view: { viewType: value as PostViewType } });
                }}
                options={[
                  {
                    value: "timeline",
                    icon: <LayoutList className="h-4 w-4" />,
                    ariaLabel: "Timeline",
                  },
                  {
                    value: "calendar",
                    icon: <CalendarDays className="h-4 w-4" />,
                    ariaLabel: "Calendar",
                  },
                  {
                    value: "swimlane",
                    icon: <Columns3 className="h-4 w-4" />,
                    ariaLabel: "Swimlane",
                  },
                ]}
                size="sm"
              />
              <PlanViewSettings />
            </div>
          }
        />
        <div className="mt-2 flex items-center gap-2">
          <PostFilters
            value={preferences.filter}
            onFilterChange={(filter) => {
              updatePreferences({ filter });
            }}
          />
          {preferences.view.viewType === "swimlane" && (
            <SwimlaneHiddenChannelsDropdown channels={channels ?? []} />
          )}
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-6">
        {!(channels?.length) && <PlanEmptyState />}
        {(channels?.length ?? 0) > 0 && preferences.view.viewType === "timeline" && (
          <PostTimeline posts={posts} onUpdate={refetchPosts} />
        )}
        {(channels?.length ?? 0) > 0 && preferences.view.viewType === "calendar" && (
          <PostCalendar posts={posts} onUpdate={refetchPosts} />
        )}
        {(channels?.length ?? 0) > 0 && preferences.view.viewType === "swimlane" && (
          <PostSwimlane posts={posts} onUpdate={refetchPosts} />
        )}
      </div>
    </div>
  );
};

