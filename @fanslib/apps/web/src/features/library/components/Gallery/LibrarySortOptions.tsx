import type { MediaSort, SortField } from "@fanslib/types";
import { ArrowUpDown, Check } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/Popover";
import { cn } from "~/lib/cn";

export type SortOption = MediaSort;

const sortOptions: { value: SortField; label: string }[] = [
  {
    value: "fileModificationDate",
    label: "Modified Date",
  },
  {
    value: "fileCreationDate",
    label: "Created Date",
  },
  {
    value: "lastPosted",
    label: "Last Posted",
  },
];

type LibrarySortOptionsProps = {
  value: SortOption;
  onChange: (value: SortOption) => void;
};

export const LibrarySortOptions = ({ value, onChange }: LibrarySortOptionsProps) => {
  const selectedSortOption = sortOptions.find((option) => option.value === value.field);

  return (
    <div className="flex items-center gap-2">
      <Popover >
        <PopoverTrigger asChild>
          <Button variant="outline" >
            <ArrowUpDown className="h-4 w-4" />
            {selectedSortOption?.label}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-2">
          <div className="grid gap-1">
            {sortOptions.map((sortOption) =>
              (["ASC", "DESC"] as const).map((direction) => (
                <button
                  key={`${sortOption.value}-${direction}`}
                  onClick={() => {
                    onChange({ field: sortOption.value, direction });
                  }}
                  className={cn(
                    "flex items-center justify-between w-full px-2 py-1.5 text-sm rounded-sm relative",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus:bg-accent focus:text-accent-foreground focus:outline-none",
                    value.field === sortOption.value && value.direction === direction
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground"
                  )}
                >
                  <span className="flex items-center gap-2">
                    {sortOption.label}
                    <span className="text-xs text-muted-foreground">
                      {direction === "ASC" ? "↑" : "↓"}
                    </span>
                  </span>
                  {value.field === sortOption.value && value.direction === direction && (
                    <Check className="h-4 w-4 ml-2" />
                  )}
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
