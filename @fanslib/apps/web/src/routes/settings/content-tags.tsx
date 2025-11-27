import { createFileRoute } from "@tanstack/react-router";
import { TagDimensionsTab } from "~/features/tags/components/TagDimensionsTab";

const ContentTagsSettings = () => <TagDimensionsTab />;

export const Route = createFileRoute("/settings/content-tags")({
  component: ContentTagsSettings,
});

