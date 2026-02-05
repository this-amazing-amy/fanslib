import { createFileRoute } from "@tanstack/react-router";
import { addMonths, endOfMonth, startOfMonth } from "date-fns";
import { PostPreferencesProvider } from "~/contexts/PostPreferencesContext";
import { PlanPage } from "~/features/posts/components/PlanPage";
import { contentSchedulesQueryOptions } from "~/lib/queries/content-schedules";
import { postsQueryOptions } from "~/lib/queries/posts";

const PlanRoute = () => (
  <PostPreferencesProvider>
    <PlanPage />
  </PostPreferencesProvider>
);

export const Route = createFileRoute("/plan/")({
  loader: async ({ context }) => {
    const now = new Date();
    const defaultRange = {
      startDate: addMonths(startOfMonth(now), -1),
      endDate: addMonths(startOfMonth(now), 3),
    };

    // Fire-and-forget prefetch - don't block navigation
    void context.queryClient.prefetchQuery(
      postsQueryOptions({
        filters: JSON.stringify({
          dateRange: {
            startDate: defaultRange.startDate.toISOString(),
            endDate: endOfMonth(defaultRange.endDate).toISOString(),
          },
        }),
      })
    );
    void context.queryClient.prefetchQuery(contentSchedulesQueryOptions());
  },
  component: PlanRoute,
});
