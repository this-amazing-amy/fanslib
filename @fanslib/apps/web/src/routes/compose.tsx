import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { cn } from "~/lib/cn";

const ComposeLayout = () => {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const tabs = [
    { id: "draft", label: "Draft", to: "/compose/draft" },
    { id: "caption", label: "Caption", to: "/compose/caption" },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-8 pt-8 pb-12 space-y-6">
      <div className="flex items-center gap-4">
        {tabs.map((tab) => {
          const isActive = currentPath === tab.to || currentPath.startsWith(`${tab.to}/`);
          return (
            <Link
              key={tab.id}
              to={tab.to}
              className={cn(
                "text-2xl font-bold transition-colors",
                isActive
                  ? "text-base-content"
                  : "text-base-content/40 hover:text-base-content/60"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
      <Outlet />
    </div>
  );
};

export const Route = createFileRoute("/compose")({
  component: ComposeLayout,
});
