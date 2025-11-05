import { cn } from "~/lib/cn";
import { FilterDropdown } from "./FilterDropdown";
import { FilterGroupEditor } from "./FilterGroupEditor";
import { FilterPresetDropdown } from "./FilterPresetDropdown";
import { useMediaFilters } from "./MediaFiltersContext";

type MediaFiltersProps = {
  className?: string;
};

export const MediaFilters = ({ className = "" }: MediaFiltersProps) => {
  const { filters } = useMediaFilters();

  if (filters.length === 0) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <FilterDropdown />
        <FilterPresetDropdown />
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 w-full">
      <FilterGroupEditor className="flex-grow" />
    </div>
  );
};
