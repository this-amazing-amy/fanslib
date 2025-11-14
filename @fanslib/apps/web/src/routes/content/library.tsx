import { createFileRoute, Outlet } from "@tanstack/react-router";
import { NavigationPageHeader } from "~/components/ui/NavigationPageHeader";

const LibraryLayout = () => (
  <div className="flex h-full w-full flex-col overflow-hidden">
    <div className="flex-none px-6 py-6">
      <NavigationPageHeader
        tabs={[
          { label: "Library", to: "/content/library/media" },
          { label: "Shoots", to: "/content/library/shoots" },
        ]}
      />
    </div>
    <div className="flex-1 min-h-0 overflow-hidden">
      <Outlet />
    </div>
  </div>
);

export const Route = createFileRoute("/content/library")({
  component: LibraryLayout,
});

