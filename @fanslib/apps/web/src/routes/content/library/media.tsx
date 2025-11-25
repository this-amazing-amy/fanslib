import { createFileRoute, Outlet } from "@tanstack/react-router";
const LibraryMediaPageContent = () => (
  <div className="relative flex h-full w-full flex-col overflow-hidden">
    <Outlet />
  </div>
);

export const Route = createFileRoute("/content/library/media")({
  component: LibraryMediaPageContent,
});
