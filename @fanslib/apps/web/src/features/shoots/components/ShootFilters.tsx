import type { ShootFilters, ShootFiltersSchema } from '@fanslib/server/schemas';
import { ListX } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { Tooltip } from "~/components/ui/Tooltip";
import { ShootFilterDropdown } from "./ShootFilterDropdown";
import { ShootFilterItemRenderer } from "./ShootFilterItemRenderer";
import { ShootFiltersProvider, useShootFilters } from "./ShootFiltersContext";

type ShootFilter = ShootFilters;

type ShootFiltersProps = {
  value: ShootFilter;
  onFilterChange: (filters: Partial<ShootFilter>) => void;
};

const ShootFiltersContent = () => {
  const { filters, updateFilter, removeFilter, clearFilters, hasActiveFilters } = useShootFilters();

  return (
    <div className="flex gap-2 w-full items-start">
      {!hasActiveFilters ? (
        /* No filters: Show "Filter" button */
        <ShootFilterDropdown />
      ) : (
        /* With filters: Show filter items + actions */
        <>
          <div className="flex-grow flex flex-wrap gap-2">
            {filters.map((filter, index) => (
              <ShootFilterItemRenderer
                key={filter.type}
                item={filter}
                onChange={(item) => updateFilter(index, item)}
                onRemove={() => removeFilter(index)}
              />
            ))}
            <ShootFilterDropdown variant="compact" />
          </div>
          <div className="flex items-center gap-1">
            <Tooltip content={<p>Clear all filters</p>} openDelayMs={0}>
              <Button variant="ghost" size="icon" onPress={clearFilters} className="h-9 w-9">
                <ListX className="h-4 w-4" />
              </Button>
            </Tooltip>
          </div>
        </>
      )}
    </div>
  );
};

export const ShootFilters = ({ value, onFilterChange }: ShootFiltersProps) => (
  <ShootFiltersProvider value={value} onChange={onFilterChange}>
    <ShootFiltersContent />
  </ShootFiltersProvider>
);


