import { Layers, ListX } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { Tooltip, TooltipTrigger } from "~/components/ui/Tooltip";
import { FilterPresetDropdown } from "./FilterPresetDropdown";
import { useMediaFilters } from "./MediaFiltersContext";

type FilterActionsProps = {
  className?: string;
};

export const FilterActions = ({ className = "" }: FilterActionsProps) => {
  const { addEmptyGroup, clearFilters, hasActiveFilters } = useMediaFilters();

  const hiddenClass = !hasActiveFilters ? "hidden" : "";

  return (
    <div className={`flex items-center gap-1 ${className} ${hiddenClass}`}>
      <TooltipTrigger>
        <FilterPresetDropdown disabled={!hasActiveFilters} />
        <Tooltip>
          <p>Filter presets</p>
        </Tooltip>
      </TooltipTrigger>
      <TooltipTrigger>
        <Button variant="ghost" size="icon" onPress={addEmptyGroup} className="h-9 w-9">
          <Layers className="h-4 w-4" />
        </Button>
        <Tooltip>
          <p>Add filter group</p>
        </Tooltip>
      </TooltipTrigger>
      <TooltipTrigger>
        <Button variant="ghost" size="icon" onPress={clearFilters} className="h-9 w-9">
          <ListX className="h-4 w-4" />
        </Button>
        <Tooltip>
          <p>Clear all filters</p>
        </Tooltip>
      </TooltipTrigger>
    </div>
  );
};
