import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "~/components/ui/PageContainer/PageContainer";
import { PageHeader } from "~/components/ui/PageHeader/PageHeader";
import { RepostCandidatesPage } from "~/features/analytics/components/RepostCandidatesPage";

const RepostCandidatesRoute = () => (
  <PageContainer>
    <PageHeader
      title="Repost Candidates"
      description="Media eligible for reposting, ranked by best-ever performance"
    />
    <RepostCandidatesPage />
  </PageContainer>
);

export const Route = createFileRoute("/analytics/fyp/repost")({
  component: RepostCandidatesRoute,
});
