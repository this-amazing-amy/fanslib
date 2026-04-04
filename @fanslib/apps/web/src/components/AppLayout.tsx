import { useAtom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { type ReactNode, useEffect } from "react";
import { CredentialStatusBadge } from "~/components/CredentialStatusBadge";
import { RenderQueueBadge } from "~/features/editor/components/RenderQueueBadge";
import { Logo } from "~/components/Logo";
import { NavigationMenu } from "~/components/NavigationMenu";
import { BurgerIcon } from "~/components/ui/BurgerIcon";
import { ThemeProvider } from "~/contexts/ThemeContext";
import { cn } from "~/lib/cn";
import { useToggleSfwModeMutation } from "~/lib/queries/settings";
import {
  mobileNavigationDrawerOpenAtom,
  sidebarCollapsedAtom,
  toggleSidebarAtom,
} from "~/state/sidebar";

export type AppLayoutProps = {
  children: ReactNode;
  initialSidebarCollapsed: boolean;
};

const MainContent = ({ children }: { children: ReactNode }) => (
  <main
    className={cn("flex-1 min-h-0 overflow-y-auto content-area")}
    style={{ viewTransitionName: "main-content" }}
  >
    {children}
  </main>
);

const LayoutContent = ({ children, initialSidebarCollapsed }: AppLayoutProps) => {
  useHydrateAtoms([[sidebarCollapsedAtom, initialSidebarCollapsed]]);
  const [sidebarOpen] = useAtom(mobileNavigationDrawerOpenAtom);
  const [, toggleSidebar] = useAtom(toggleSidebarAtom);
  const [isCollapsed] = useAtom(sidebarCollapsedAtom);
  const toggleSfwMode = useToggleSfwModeMutation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        toggleSfwMode.mutate();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSfwMode]);

  return (
    <ThemeProvider>
      <div className="drawer lg:drawer-open">
        <input
          id="drawer-toggle"
          type="checkbox"
          className="drawer-toggle"
          checked={sidebarOpen}
          aria-label="Toggle navigation menu"
          onChange={() => toggleSidebar()}
        />

        {/* Page content */}
        <div className="drawer-content flex flex-col h-[100svh]">
          <header className="main-header flex items-center bg-base-100 lg:hidden h-16 px-4 gap-2">
            <label htmlFor="drawer-toggle" className="btn btn-square btn-ghost">
              <BurgerIcon />
            </label>
            <Logo isCollapsed={false} className="h-8" />
            <div className="ml-auto flex items-center gap-2">
              <RenderQueueBadge />
              <CredentialStatusBadge />
            </div>
          </header>

          <MainContent>{children}</MainContent>
        </div>

        {/* Sidebar - Responsive width and touch-friendly */}
        <div className="drawer-side z-40">
          <label htmlFor="drawer-toggle" className="drawer-overlay lg:hidden"></label>
          <aside
            className={cn(
              "sidebar min-h-full bg-base-200 text-base-content flex flex-col",
              "w-64 sm:w-72",
              isCollapsed ? "lg:w-20" : "lg:w-80",
            )}
          >
            {/* Sidebar header - Touch-friendly */}
            <div className={cn("p-4 lg:p-6", isCollapsed && "lg:p-4")}>
              <Logo isCollapsed={isCollapsed} />
            </div>

            <NavigationMenu isCollapsed={isCollapsed} />

            <div
              className={cn(
                "mt-auto p-4 border-t border-base-300 flex items-center gap-2",
                isCollapsed && "lg:flex lg:justify-center",
              )}
            >
              <RenderQueueBadge />
              <CredentialStatusBadge />
            </div>
          </aside>
        </div>
      </div>
    </ThemeProvider>
  );
};

export const AppLayout = ({ children, initialSidebarCollapsed }: AppLayoutProps) => (
  <LayoutContent initialSidebarCollapsed={initialSidebarCollapsed}>{children}</LayoutContent>
);
