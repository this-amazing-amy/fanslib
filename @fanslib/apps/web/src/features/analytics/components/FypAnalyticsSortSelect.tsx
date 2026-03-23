import { ArrowUpDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "~/components/ui/Select";

export const FYP_ANALYTICS_SORT_OPTIONS = [
  { value: "views", label: "Views" },
  { value: "engagementPercent", label: "Engagement %" },
  { value: "engagementSeconds", label: "Engagement Time" },
] as const;

export type FypAnalyticsSortBy = (typeof FYP_ANALYTICS_SORT_OPTIONS)[number]["value"];

type FypAnalyticsSortSelectProps = {
  value: FypAnalyticsSortBy;
  onChange: (value: FypAnalyticsSortBy) => void;
};

export const FypAnalyticsSortSelect = ({ value, onChange }: FypAnalyticsSortSelectProps) => {
  const selected = FYP_ANALYTICS_SORT_OPTIONS.find((o) => o.value === value);

  return (
    <Select
      value={value}
      onValueChange={(next) => {
        const option = FYP_ANALYTICS_SORT_OPTIONS.find((o) => o.value === next);
        if (option) onChange(option.value);
      }}
      aria-label="Sort by"
    >
      <SelectTrigger className="h-9 w-fit max-w-full gap-2 rounded-full border border-base-content px-4">
        <ArrowUpDown className="h-4 w-4 shrink-0" />
        <span>{selected?.label ?? "Sort by…"}</span>
      </SelectTrigger>
      <SelectContent className="w-[280px]" align="end">
        {FYP_ANALYTICS_SORT_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
