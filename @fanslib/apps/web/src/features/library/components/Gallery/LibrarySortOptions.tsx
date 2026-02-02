import type { MediaSort, SortField } from '@fanslib/server/schemas';
import { ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "~/components/ui/Select";

export type SortOption = MediaSort;

const sortFields: { value: SortField; label: string; directions?: ('ASC' | 'DESC')[] }[] = [
  {
    value: "fileCreationDate",
    label: "Newest Added",
    directions: ["DESC"], // Newest first (default)
  },
  {
    value: "fileCreationDate",
    label: "Oldest Added",
    directions: ["ASC"], // Oldest first
  },
  {
    value: "lastPosted",
    label: "Recently Posted",
    directions: ["DESC"], // Most recently posted first
  },
  {
    value: "leastPosted",
    label: "Least Posted",
    directions: ["ASC"], // Least posted first
  },
];

const createSortOptions = () => sortFields.map((field) => {
    const direction = field.directions?.[0] ?? "DESC";
    const value = `${field.value}:${direction}`;

    return {
      value,
      label: field.label,
      field: field.value,
      direction,
    };
  });

const sortOptions = createSortOptions();

type LibrarySortOptionsProps = {
  value: SortOption;
  onChange: (value: SortOption) => void;
};

export const LibrarySortOptions = ({ value, onChange }: LibrarySortOptionsProps) => {
  const currentValue = `${value.field}:${value.direction}`;
  const selectedOption = sortOptions.find((opt) => opt.value === currentValue);

  const handleValueChange = (newValue: string) => {
    const option = sortOptions.find((opt) => opt.value === newValue);
    if (option) {
      onChange({ field: option.field, direction: option.direction });
    }
  };

  return (
    <Select
      value={currentValue}
      onValueChange={handleValueChange}
      aria-label="Sort media"
    >
      <SelectTrigger className="h-9 gap-2 rounded-full border border-base-content px-4">
          <ArrowUpDown className="h-4 w-4" />
          <span>{selectedOption?.label ?? "Sort by..."}</span>
      </SelectTrigger>
      <SelectContent className="w-[280px]" align="end">
        {sortOptions.map((option) => <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>)}
      </SelectContent>
    </Select>
  );
};
