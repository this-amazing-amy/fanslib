import { Layers, ListX } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/Tooltip";
import { FilterPresetDropdown } from "./FilterPresetDropdown";
import { useMediaFilters } from "./MediaFiltersContext";

type FilterActionsProps = {
  className?: string;
};

export const FilterActions = ({ className = "" }: FilterActionsProps) => {
  const { addEmptyGroup, clearFilters, hasActiveFilters } = useMediaFilters();

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <>
      <TooltipProvider>
        <div className={`flex items-center gap-1 ${className}`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <FilterPresetDropdown disabled={!hasActiveFilters} />
            </TooltipTrigger>
            <TooltipContent>
              <p>Filter presets</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={addEmptyGroup} className="h-9 w-9">
                <Layers className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add filter group</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={clearFilters} className="h-9 w-9">
                <ListX className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clear all filters</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </>
  );
};
