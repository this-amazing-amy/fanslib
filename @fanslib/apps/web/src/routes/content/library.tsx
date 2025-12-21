import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { NavigationPageHeader } from "~/components/ui/NavigationPageHeader";

const LibraryLayout = () => {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const isDetailPage = /\/media\/[^/]+$/.test(currentPath);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {!isDetailPage && (
        <div className="flex-none px-6 py-6">
          <NavigationPageHeader
            tabs={[
              { label: "Library", to: "/content/library/media" },
              { label: "Shoots", to: "/content/library/shoots" },
            ]}
          />
        </div>
      )}
      <div className="flex-1 min-h-0 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};

export const Route = createFileRoute("/content/library")({
  component: LibraryLayout,
});

