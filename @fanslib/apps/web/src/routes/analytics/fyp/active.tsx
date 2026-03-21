import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "~/components/ui/PageContainer/PageContainer";
import { PageHeader } from "~/components/ui/PageHeader/PageHeader";
import { ActiveFypPostsPage } from "~/features/analytics/components/ActiveFypPostsPage";

const ActiveFypPostsRoute = () => (
  <PageContainer>
    <PageHeader
      title="Active FYP Posts"
      description="Posts currently active on the For You Page, sorted worst-to-best"
    />
    <ActiveFypPostsPage />
  </PageContainer>
);

export const Route = createFileRoute("/analytics/fyp/active")({
  component: ActiveFypPostsRoute,
});
