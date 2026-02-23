import { createFileRoute } from "@tanstack/react-router";
import { addWeeks, endOfDay, startOfWeek, subWeeks } from "date-fns";
import { de } from "date-fns/locale";
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
    const weekStart = startOfWeek(new Date(), { locale: de });
    const prefetchRange = {
      startDate: subWeeks(weekStart, 1),
      endDate: endOfDay(addWeeks(weekStart, 3)),
    };

    void context.queryClient.prefetchQuery(
      postsQueryOptions({
        filters: JSON.stringify({
          dateRange: {
            startDate: prefetchRange.startDate.toISOString(),
            endDate: prefetchRange.endDate.toISOString(),
          },
        }),
      })
    );
    void context.queryClient.prefetchQuery(contentSchedulesQueryOptions());
  },
  component: PlanRoute,
});
