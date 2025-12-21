import type { PostWithRelationsSchema } from "@fanslib/server/schemas";
import { CalendarDays, LayoutList } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ToggleGroup } from "~/components/ui/ToggleGroup";
import { SectionHeader } from "~/components/ui/SectionHeader";
import { usePostPreferences, type PostViewType } from "~/contexts/PostPreferencesContext";
import { useChannelsQuery } from "~/lib/queries/channels";
import { useContentSchedulesQuery } from "~/lib/queries/content-schedules";
import { usePostsQuery } from "~/lib/queries/posts";
import { filterPostsByType, generateVirtualPosts, type VirtualPost } from "~/lib/virtual-posts";
import { PlanEmptyState } from "./PlanEmptyState";
import { PlanViewSettings } from "./PlanViewSettings";
import { PostCalendar } from "./PostCalendar/PostCalendar";
import { PostFilters } from "./PostFilters";
import { PostTimeline } from "./PostTimeline";

type Post = typeof PostWithRelationsSchema.static;

export const PlanContent = () => {
  const { data: channels = [] } = useChannelsQuery();
  const { preferences, updatePreferences } = usePostPreferences();
  const [posts, setPosts] = useState<(Post | VirtualPost)[]>([]);

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

  const { data: schedules, refetch: refetchSchedules } = useContentSchedulesQuery();

  const fetchPosts = useCallback(async () => {
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

    const filteredSchedules = (schedules ?? []).filter(
      (s) =>
        !preferences.filter.channels || preferences.filter.channels?.includes((s.channel as { id: string })?.id)
    );

    const virtualPosts = shouldShowDraftPosts
      ? generateVirtualPosts(filteredSchedules, allPosts ?? [])
      : [];

    const allPostsCombined = [...(filteredPosts ?? []), ...virtualPosts].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const filteredByType = filterPostsByType(allPostsCombined, preferences.view.postTypeFilter);

    setPosts(filteredByType);
  }, [filteredPosts, allPosts, schedules, preferences.filter, preferences.view.postTypeFilter]);

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
                ]}
                size="sm"
              />
              <PlanViewSettings />
            </div>
          }
        />
        <div className="mt-2">
          <PostFilters
            value={preferences.filter}
            onFilterChange={(filter) => {
              updatePreferences({ filter });
            }}
          />
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
      </div>
    </div>
  );
};

