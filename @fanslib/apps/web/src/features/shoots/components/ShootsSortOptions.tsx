import { ArrowUpDown } from "lucide-react";
import type { ShootSortDirection, ShootSortField } from "~/contexts/ShootPreferencesContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "~/components/ui/Select";

type ShootSort = {
  field: ShootSortField;
  direction: ShootSortDirection;
};

const sortFields: { value: ShootSortField; label: string }[] = [
  {
    value: "name",
    label: "Name",
  },
  {
    value: "date",
    label: "Date",
  },
  {
    value: "mediaCount",
    label: "Media Count",
  },
];

const createSortOptions = () =>
  sortFields.flatMap((field) =>
    (["ASC", "DESC"] as const).map((direction) => {
      const value = `${field.value}:${direction}`;
      const label = `${field.label} ${direction === "ASC" ? "↑" : "↓"}`;

      return {
        value,
        label,
        field: field.value,
        direction,
      };
    })
  );

const sortOptions = createSortOptions();

type ShootsSortOptionsProps = {
  value: ShootSort;
  onChange: (value: ShootSort) => void;
};

export const ShootsSortOptions = ({ value, onChange }: ShootsSortOptionsProps) => {
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
      aria-label="Sort shoots"
    >
      <SelectTrigger className="h-9 gap-2 rounded-full border border-base-content px-4">
        <ArrowUpDown className="h-4 w-4" />
        <span>{selectedOption?.label ?? "Sort by..."}</span>
      </SelectTrigger>
      <SelectContent className="w-[280px]" align="end">
        {sortOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

