import { useNavigate } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { cn } from "~/lib/cn";

export const ViewNavigationIndicator = () => {
  const navigate = useNavigate();

  const navigateToSchedule = () => {
    navigate({ to: "/content/schedule" });
  };

  return (
    <button
      onClick={navigateToSchedule}
      className={cn(
        "fixed right-0 top-1/2 -translate-y-1/2 z-50",
        "flex items-center justify-center w-12 h-24",
        "bg-base-200/80 hover:bg-base-200 border-l border-base-300",
        "rounded-l-lg shadow-lg",
        "transition-all duration-300 ease-in-out",
        "hover:translate-x-[-4px]",
        "group"
      )}
      aria-label="Open schedule view"
    >
      <ChevronRight className="h-6 w-6 text-base-content/60 group-hover:text-base-content transition-colors" />
    </button>
  );
};

