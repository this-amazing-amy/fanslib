import { createFileRoute } from "@tanstack/react-router";
import { Library } from "~/features/library/components/Library";

const LibraryMediaIndexPageContent = () => (
  <div className="relative flex h-full w-full flex-col overflow-hidden">
    <Library />
  </div>
);

export const Route = createFileRoute("/content/library/media/")({
  component: LibraryMediaIndexPageContent,
});

