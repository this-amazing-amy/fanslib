import type { MediaFilter } from '@fanslib/server/schemas';
import { Filter, FilterX, X } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { Tooltip } from "~/components/ui/Tooltip";
import { FilterDropdown } from "./FilterDropdown";
import { FilterItemRenderer } from "./FilterItemRenderer";
import { useMediaFilters } from "./MediaFiltersContext";

type FilterItem = MediaFilter[number]["items"][number];

const getFilterItemKey = (item: FilterItem, index: number): string => {
  if ("id" in item) return `${item.type}-${item.id}`;
  if ("dimensionId" in item) return `${item.type}-${item.dimensionId}`;
  // Use index for value-based filters (caption, filename, etc.) to prevent re-mounting on typing
  return `${item.type}-${index}`;
};

type FilterGroupEditorProps = {
  className?: string;
};

export const FilterGroupEditor = ({ className = "" }: FilterGroupEditorProps) => {
  const { filters, removeGroup, updateGroupInclude, updateFilterInGroup, removeFilterFromGroup } =
    useMediaFilters();

  return (
    <div className={`${className} space-y-2`}>
      {filters.map((group, groupIndex) => (
        // eslint-disable-next-line react/no-array-index-key
        <div key={`group-${groupIndex}-${group.include ? "include" : "exclude"}`} className="border rounded-lg">
          <div className="px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1 overflow-x-auto overflow-y-visible py-1">
                <div className="flex items-center gap-2 w-max">
                  <Tooltip
                    content={<p>{group.include ? "Include filters" : "Exclude filters"}</p>}
                    openDelayMs={0}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onPress={() => updateGroupInclude(groupIndex, !group.include)}
                    >
                      {group.include ? (
                        <Filter className="h-4 w-4 text-green-700" />
                      ) : (
                        <FilterX className="h-4 w-4 text-red-700" />
                      )}
                    </Button>
                  </Tooltip>

                  {group.items.map((item, itemIndex) => (
                    <div key={getFilterItemKey(item, itemIndex)} className="flex-shrink-0">
                      <FilterItemRenderer
                        type={item.type}
                        value={item}
                        onChange={(newItem) => updateFilterInGroup(groupIndex, itemIndex, newItem)}
                        onRemove={() => removeFilterFromGroup(groupIndex, itemIndex)}
                      />
                    </div>
                  ))}

                  <FilterDropdown groupIndex={groupIndex} variant="compact" className="ml-4" />
                </div>
              </div>

              <Tooltip content={<p>Remove group</p>} openDelayMs={0}>
                <Button
                  variant="ghost"
                  size="icon"
                  onPress={() => removeGroup(groupIndex)}
                  className="h-9 w-9"
                >
                  <X className="h-4 w-4" />
                </Button>
              </Tooltip>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
