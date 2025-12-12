import { Layers, ListX } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { Tooltip } from "~/components/ui/Tooltip";
import { FilterPresetDropdown } from "./FilterPresetDropdown";
import { useMediaFilters } from "./MediaFiltersContext";

type FilterActionsProps = {
  className?: string;
};

export const FilterActions = ({ className = "" }: FilterActionsProps) => {
  const { addEmptyGroup, clearFilters } = useMediaFilters();

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <FilterPresetDropdown />
      <Tooltip content={<p>Add filter group</p>} openDelayMs={0}>
        <Button variant="ghost" size="icon" onPress={addEmptyGroup} className="h-9 w-9">
          <Layers className="h-4 w-4" />
        </Button>
      </Tooltip>
      <Tooltip content={<p>Clear all filters</p>} openDelayMs={0}>
        <Button variant="ghost" size="icon" onPress={clearFilters} className="h-9 w-9">
          <ListX className="h-4 w-4" />
        </Button>
      </Tooltip>
    </div>
  );
};
