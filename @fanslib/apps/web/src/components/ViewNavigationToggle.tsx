import { useNavigate } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "~/lib/cn";
import { sidebarCollapsedAtom } from "~/state/sidebar";

type ViewNavigationToggleProps = {
  position: "left" | "right";
  to: string;
  label: string;
};

export const ViewNavigationToggle = ({ position, to, label }: ViewNavigationToggleProps) => {
  const navigate = useNavigate();
  const [isCollapsed] = useAtom(sidebarCollapsedAtom);

  const navigateToRoute = () => {
    navigate({ to });
  };

  const Icon = position === "left" ? ChevronLeft : ChevronRight;
  const positionClasses =
    position === "left"
      ? `${isCollapsed ? "left-20" : "left-80"} rounded-r-lg border-r`
      : "right-0 rounded-l-lg border-l";

  return (
    <button
      onClick={navigateToRoute}
      className={cn(
        "fixed top-1/2 -translate-y-1/2 z-50",
        positionClasses,
        "flex items-center justify-center w-12 h-24",
        "bg-base-200/80 hover:bg-base-200 border-base-300",
        "shadow-lg",
        "transition-all duration-300 ease-in-out",
        position === "left" ? "hover:translate-x-[4px]" : "hover:translate-x-[-4px]",
        "group"
      )}
      aria-label={label}
    >
      <Icon className="h-6 w-6 text-base-content/60 group-hover:text-base-content transition-colors" />
    </button>
  );
};

