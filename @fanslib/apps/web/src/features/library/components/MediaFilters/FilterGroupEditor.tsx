import { Filter, FilterX, X } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { Tooltip, TooltipTrigger } from "~/components/ui/Tooltip";
import { FilterDropdown } from "./FilterDropdown";
import { FilterItemRenderer } from "./FilterItemRenderer";
import { useMediaFilters } from "./MediaFiltersContext";

type FilterGroupEditorProps = {
  className?: string;
};

export const FilterGroupEditor = ({ className = "" }: FilterGroupEditorProps) => {
  const { filters, removeGroup, updateGroupInclude, updateFilterInGroup, removeFilterFromGroup } =
    useMediaFilters();

  return (
    <div className={`${className} space-y-2`}>
      {filters.map((group, groupIndex) => (
        <div key={groupIndex} className="border rounded-lg">
          <div className="px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <TooltipTrigger>
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
                  <Tooltip>
                    <p>{group.include ? "Include filters" : "Exclude filters"}</p>
                  </Tooltip>
                </TooltipTrigger>

                {group.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex-shrink-0">
                    <FilterItemRenderer
                      type={item.type}
                      value={item}
                      onChange={(newItem) => updateFilterInGroup(groupIndex, itemIndex, newItem)}
                      onRemove={() => removeFilterFromGroup(groupIndex, itemIndex)}
                    />
                  </div>
                ))}

                <FilterDropdown groupIndex={groupIndex} variant="compact" />
              </div>

              <TooltipTrigger>
                <Button
                  variant="ghost"
                  size="icon"
                  onPress={() => removeGroup(groupIndex)}
                  className="h-9 w-9"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Tooltip>
                  <p>Remove group</p>
                </Tooltip>
              </TooltipTrigger>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
