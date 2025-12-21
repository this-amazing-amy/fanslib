import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "~/components/ui/PageContainer";
import { PageHeader } from "~/components/ui/PageHeader/PageHeader";
import { MatchingPage } from "~/features/analytics/components/MatchingPage";

const AnalyticsMatchingRoute = () => (
  <PageContainer>
    <PageHeader
      title="Analytics Matching"
      description="Review and match Fansly media candidates to your posts"
    />
    <MatchingPage />
  </PageContainer>
);

export const Route = createFileRoute("/analytics/matching")({
  component: AnalyticsMatchingRoute,
});

