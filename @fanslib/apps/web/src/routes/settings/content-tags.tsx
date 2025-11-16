import { createFileRoute } from "@tanstack/react-router";
import { Tags } from "lucide-react";
import { TagDimensionsTab } from "~/features/tags/components/TagDimensionsTab";

const ContentTagsSettings = () => (
  <div className="space-y-6">
    <div>
      <h1 className="flex items-center gap-2 text-2xl font-semibold">
        <Tags /> Content Tags
      </h1>
      <p className="text-base-content/60">
        Manage tag dimensions for your content organization
      </p>
    </div>

    <TagDimensionsTab />
  </div>
);

export const Route = createFileRoute("/settings/content-tags")({
  component: ContentTagsSettings,
});

