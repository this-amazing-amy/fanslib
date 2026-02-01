import { createFileRoute } from "@tanstack/react-router";
import { MediaDragProvider } from "~/contexts/MediaDragContext";
import { PostDragProvider } from "~/contexts/PostDragContext";
import { PostPreferencesProvider } from "~/contexts/PostPreferencesContext";
import { AnalyticsDashboard } from "~/features/analytics/components/AnalyticsDashboard";

const AnalyticsRoute = () => (
  <MediaDragProvider>
    <PostDragProvider>
      <PostPreferencesProvider>
        <AnalyticsDashboard />
      </PostPreferencesProvider>
    </PostDragProvider>
  </MediaDragProvider>
);

export const Route = createFileRoute("/analytics/matching")({
  component: AnalyticsRoute,
});

