import { ListX } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { Tooltip } from "~/components/ui/Tooltip";
import type { PostFilterPreferences } from "~/contexts/PostPreferencesContext";
import { PostFiltersProvider, usePostFilters } from "./PostFiltersContext";
import { PostFilterDropdown } from "./PostFilterDropdown";
import { PostFilterItemRenderer } from "./PostFilterItemRenderer";

type PostFiltersProps = {
  value: PostFilterPreferences;
  onFilterChange: (filters: Partial<PostFilterPreferences>) => void;
};

const PostFiltersContent = () => {
  const { filters, updateFilter, removeFilter, clearFilters, hasActiveFilters } = usePostFilters();

  return (
    <div className="flex gap-2 w-full items-start">
      {!hasActiveFilters ? (
        /* No filters: Show "Filter" button */
        <PostFilterDropdown />
      ) : (
        /* With filters: Show filter items + actions */
        <>
          <div className="flex-grow flex flex-wrap gap-2">
            {filters.map((filter, index) => (
              <PostFilterItemRenderer
                key={`${filter.type}-${index}`}
                item={filter}
                onChange={(item) => updateFilter(index, item)}
                onRemove={() => removeFilter(index)}
              />
            ))}
            <PostFilterDropdown variant="compact" />
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

export const PostFilters = ({ value, onFilterChange }: PostFiltersProps) => <PostFiltersProvider value={value} onChange={onFilterChange}>
      <PostFiltersContent />
    </PostFiltersProvider>;
