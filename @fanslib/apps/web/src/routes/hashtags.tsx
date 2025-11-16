import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "~/components/ui/PageContainer";
import { PageHeader } from "~/components/ui/PageHeader/PageHeader";
import { HashtagsTab } from "~/features/tags/components/HashtagsTab";

const HashtagsPage = () => (
  <PageContainer>
    <PageHeader
      title="Hashtags"
      description="Manage hashtags for your content organization"
    />
    <HashtagsTab />
  </PageContainer>
);

export const Route = createFileRoute("/hashtags")({
  component: HashtagsPage,
});

