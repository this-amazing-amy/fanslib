import { cn } from "~/lib/cn";
import { useHydrated } from "~/hooks/useHydrated";
import { FilterDropdown } from "./FilterDropdown";
import { FilterActions } from "./FilterActions";
import { FilterGroupEditor } from "./FilterGroupEditor";
import { useMediaFilters } from "./MediaFiltersContext";

type MediaFiltersProps = {
  className?: string;
};

export const MediaFilters = ({ className = "" }: MediaFiltersProps) => {
  const { filters } = useMediaFilters();
  const isHydrated = useHydrated();

  // Force empty state until hydration completes
  const displayFilters = isHydrated ? filters : [];

  return (
    <div className={cn("flex gap-2 w-full", displayFilters.length === 0 ? "items-center" : "items-start", className)}>
      {displayFilters.length === 0 ? (
        /* No filters: Show "Filter" button centered */
        <div className="pt-2">
          <FilterDropdown />
        </div>
      ) : (
        /* With filters: Show filter groups + actions (preset, clear, add group) */
        <>
          <div className="flex-grow">
            <FilterGroupEditor />
          </div>
          <FilterActions />
        </>
      )}
    </div>
  );
};
