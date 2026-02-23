import { createFileRoute, Outlet } from "@tanstack/react-router";

const LibraryLayout = () => (
  <div className="flex h-full w-full flex-col overflow-hidden">
    <Outlet />
  </div>
);

export const Route = createFileRoute("/content/library")({
  component: LibraryLayout,
});
