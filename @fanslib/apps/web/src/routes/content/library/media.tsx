import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ViewNavigationIndicator } from "~/components/ViewNavigationIndicator";

const LibraryMediaPageContent = () => (
  <div className="relative flex h-full w-full flex-col overflow-hidden">
    <Outlet />
    <ViewNavigationIndicator />
  </div>
);

export const Route = createFileRoute("/content/library/media")({
  component: LibraryMediaPageContent,
});
