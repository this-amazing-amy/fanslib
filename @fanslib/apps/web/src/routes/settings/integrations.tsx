import { createFileRoute } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import { Tabs, TabItem } from "~/components/ui/Tabs";
import { BlueskySettings } from "~/features/settings/components/BlueskySettings";
import { FanslySettings } from "~/features/settings/components/FanslySettings";
import { PostponeSettings } from "~/features/settings/components/PostponeSettings";
import { RedditSettings } from "~/features/settings/components/RedditSettings";

const IntegrationsSettings = () => (
  <div className="space-y-6">
    <div>
      <h1 className="flex items-center gap-2 text-2xl font-semibold">
        <Zap /> Integrations
      </h1>
      <p className="text-base-content/60">Connect with external services and APIs</p>
    </div>

    <Tabs defaultSelectedKey="fansly">
      <TabItem key="fansly" title="Fansly">
        <FanslySettings />
      </TabItem>
      <TabItem key="bluesky" title="Bluesky">
        <BlueskySettings />
      </TabItem>
      <TabItem key="postpone" title="Postpone">
        <PostponeSettings />
      </TabItem>
      <TabItem key="reddit" title="Reddit">
        <RedditSettings />
      </TabItem>
    </Tabs>
  </div>
);

export const Route = createFileRoute("/settings/integrations")({
  component: IntegrationsSettings,
});
