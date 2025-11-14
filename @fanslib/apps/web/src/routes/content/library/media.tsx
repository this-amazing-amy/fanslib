import { createFileRoute } from "@tanstack/react-router";
import { ViewNavigationIndicator } from "~/components/ViewNavigationIndicator";
import { Library } from "~/features/library/components/Library";

const LibraryMediaPageContent = () => (
  <div className="relative flex h-full w-full flex-col overflow-hidden">
    <Library />
    <ViewNavigationIndicator />
  </div>
);

export const Route = createFileRoute("/content/library/media")({
  component: LibraryMediaPageContent,
});
