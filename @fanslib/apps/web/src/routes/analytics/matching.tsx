import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "~/components/ui/PageContainer";
import { PageHeader } from "~/components/ui/PageHeader/PageHeader";
import { MediaDragProvider } from "~/contexts/MediaDragContext";
import { PostDragProvider } from "~/contexts/PostDragContext";
import { PostPreferencesProvider } from "~/contexts/PostPreferencesContext";
import { MatchingPage } from "~/features/analytics/components/MatchingPage";

const AnalyticsMatchingRoute = () => (
  <MediaDragProvider>
    <PostDragProvider>
      <PostPreferencesProvider>
        <PageContainer className="flex h-full w-full flex-col overflow-hidden px-0 py-0">
          <PageHeader title="Analytics Matching" className="flex-shrink-0" />
          <div className="flex-1 min-h-0">
            <MatchingPage />
          </div>
        </PageContainer>
      </PostPreferencesProvider>
    </PostDragProvider>
  </MediaDragProvider>
);

export const Route = createFileRoute("/analytics/matching")({
  component: AnalyticsMatchingRoute,
});

