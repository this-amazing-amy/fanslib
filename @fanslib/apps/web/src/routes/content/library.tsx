import { createFileRoute, Outlet } from "@tanstack/react-router";

const LibraryLayout = () => (
  <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
    <Outlet />
  </div>
);

export const Route = createFileRoute("/content/library")({
  component: LibraryLayout,
});
