import { Layers, ListX } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { Tooltip } from "~/components/ui/Tooltip";
import { FilterPresetDialog } from "./FilterPresetDialog";
import { useMediaFilters } from "./MediaFiltersContext";

type FilterActionsProps = {
  className?: string;
  /** Use a full dialog for preset management (create/delete). Default is a simple dropdown for applying presets. */
  usePresetDialog?: boolean;
};

export const FilterActions = ({ className = "", usePresetDialog = false }: FilterActionsProps) => {
  const { addEmptyGroup, clearFilters } = useMediaFilters();

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {usePresetDialog && <FilterPresetDialog />}
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
