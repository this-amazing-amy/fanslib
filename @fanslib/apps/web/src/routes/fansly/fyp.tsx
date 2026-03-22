import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "~/components/ui/PageContainer/PageContainer";
import { PageHeader } from "~/components/ui/PageHeader/PageHeader";
import { ActiveFypPostsPage } from "~/features/analytics/components/ActiveFypPostsPage";
import { RepostCandidatesPage } from "~/features/analytics/components/RepostCandidatesPage";

const FanslyFypRoute = () => (
  <PageContainer>
    <PageHeader title="FYP Analytics" description="Active FYP posts and repost candidates" />
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold mb-4">Active FYP Posts</h2>
        <ActiveFypPostsPage />
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-4">Repost Candidates</h2>
        <RepostCandidatesPage />
      </section>
    </div>
  </PageContainer>
);

export const Route = createFileRoute("/fansly/fyp")({
  component: FanslyFypRoute,
});
