import { createFileRoute, Outlet } from "@tanstack/react-router";

const LibraryMediaIdLayout = () => <Outlet />;

export const Route = createFileRoute("/library/$mediaId")({
  component: LibraryMediaIdLayout,
});
