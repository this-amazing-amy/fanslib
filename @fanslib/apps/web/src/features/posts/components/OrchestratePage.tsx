import type { PostWithRelationsSchema } from "@fanslib/server/schemas";
import { useCallback, useEffect, useMemo } from "react";
import { SplitViewLayout } from "~/components/SplitViewLayout";
import { TabNavigation } from "~/components/TabNavigation";
import { PageHeader } from "~/components/ui/PageHeader";
import { ViewNavigationToggle } from "~/components/ViewNavigationToggle";
import { MediaDragProvider } from "~/contexts/MediaDragContext";
import { PostDragProvider } from "~/contexts/PostDragContext";
import { usePostPreferences } from "~/contexts/PostPreferencesContext";
import { Library } from "~/features/library/components/Library";
import { Shoots } from "~/features/shoots/components/Shoots";
import { useTabNavigation } from "~/hooks/useTabNavigation";
import { useChannelsQuery } from "~/lib/queries/channels";
import { useContentSchedulesQuery } from "~/lib/queries/content-schedules";
import { useMediaListQuery } from "~/lib/queries/library";
import { usePostsQuery } from "~/lib/queries/posts";
import { generateVirtualPosts, type VirtualPost } from "~/lib/virtual-posts";
import { PlanEmptyState } from "./PlanEmptyState";
import { PlanViewSettings } from "./PlanViewSettings";
import { PostCalendar } from "./PostCalendar/PostCalendar";
import { PostFilters } from "./PostFilters";
import { PostTimeline } from "./PostTimeline";

type Post = typeof PostWithRelationsSchema.static;

const OrchestratePageContent = () => {
  const { data: channels = [] } = useChannelsQuery();
  const { preferences, updatePreferences } = usePostPreferences();
  const { refetch: refetchLibrary } = useMediaListQuery();

  const tabs = [
    {
      id: "library" as const,
      label: "Library",
      content: <Library />,
    },
    {
      id: "shoots" as const,
      label: "Shoots",
      content: <Shoots />,
    },
  ];

  const { activeTabId, activeTab, updateActiveTab } = useTabNavigation({
    tabs,
    storageKey: "plan-side-content-view",
    defaultTabId: "library",
  });

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
    try {
      await Promise.all([refetchFilteredPosts(), refetchAllPosts(), refetchSchedules()]);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  }, [refetchFilteredPosts, refetchAllPosts, refetchSchedules]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const filterStatuses = preferences.filter?.statuses;
  const filterChannels = preferences.filter?.channels;

  const posts = useMemo(() => {
    const shouldShowDraftPosts =
      !filterStatuses || filterStatuses.includes("draft");

    const virtualPosts = shouldShowDraftPosts
      ? generateVirtualPosts(
          (schedules ?? []).filter(
            (s) =>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              !filterChannels || filterChannels.includes((s.channel as any)?.id ?? "")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ) as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (allPosts ?? []) as any
        )
      : [];

    return [...((filteredPosts ?? []) as Post[]), ...virtualPosts].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    ) as (Post | VirtualPost)[];
  }, [filteredPosts, allPosts, schedules, filterStatuses, filterChannels]);

  const refetchPostsAndLibrary = useCallback(async () => {
    await Promise.all([refetchLibrary(), fetchPosts()]);
  }, [refetchLibrary, fetchPosts]);

  return (
    <MediaDragProvider>
      <PostDragProvider>
        <SplitViewLayout
          id="orchestrate"
          mainDefaultSize={75}
          sideDefaultSize={25}
          sideMinSize={25}
          sideMaxSize={75}
          mainContent={activeTab?.content}
          mainContentHeader={
            <TabNavigation tabs={tabs} activeTabId={activeTabId} onTabChange={updateActiveTab} />
          }
          sideContent={
            <div className="h-full w-full overflow-hidden flex flex-col">
              <div className="flex-none px-6 pt-6">
                <PageHeader
                  title="Orchestrate"
                  className="mb-0"
                />
              </div>
              <div className="px-6 py-6 mb-6">
                <div className="flex items-center gap-2">
                  <PlanViewSettings />
                  <PostFilters
                    value={preferences.filter}
                    onFilterChange={(filter) => {
                      updatePreferences({ filter });
                    }}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-hidden px-6">
                {!(channels?.length) && <PlanEmptyState />}
                {(channels?.length ?? 0) > 0 && preferences.view.viewType === "timeline" && (
                  <PostTimeline posts={posts} onUpdate={refetchPostsAndLibrary} />
                )}
                {(channels?.length ?? 0) > 0 && preferences.view.viewType === "calendar" && (
                  <PostCalendar posts={posts} onUpdate={refetchPostsAndLibrary} />
                )}
              </div>
            </div>
          }
        />
        <ViewNavigationToggle
          position="left"
          to={activeTabId === "library" ? "/content/library/media" : "/content/library/shoots"}
          label="Go to library view"
        />
        <ViewNavigationToggle
          position="right"
          to="/plan"
          label="Go to plan view"
        />
      </PostDragProvider>
    </MediaDragProvider>
  );
};

export const OrchestratePage = () => <OrchestratePageContent />;

