import { parseDate } from "@internationalized/date";
import { Search, X } from "lucide-react";
import { type FC } from "react";
import type { DateValue } from "react-aria";
import type { RangeValue } from "@react-types/shared";
import { useShootContext } from "~/contexts/ShootContext";
import { Button } from "~/components/ui/Button";
import { DateRangePicker } from "~/components/ui/DateRangePicker";
import { Input } from "~/components/ui/Input";

type ShootsFilterProps = {
  className?: string;
};

export const ShootsFilter: FC<ShootsFilterProps> = ({ className }) => {
  const { filter, updateFilter, clearFilter } = useShootContext();
  const hasFilters = filter.startDate ?? filter.endDate ?? filter.name;

  const convertDateToCalendarDate = (jsDate: Date) => {
    const year = jsDate.getFullYear();
    const month = jsDate.getMonth() + 1;
    const day = jsDate.getDate();
    return parseDate(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  };

  const convertCalendarDateToJSDate = (calendarDate: DateValue) => {
    const { year, month, day } = calendarDate as { year: number; month: number; day: number };
    return new Date(year, month - 1, day);
  };

  const dateRangeValue: RangeValue<DateValue> | undefined =
    filter.startDate && filter.endDate
      ? {
          start: convertDateToCalendarDate(filter.startDate),
          end: convertDateToCalendarDate(filter.endDate),
        }
      : undefined;

  const handleDateRangeChange = (range: RangeValue<DateValue> | null) => {
    if (!range) {
      updateFilter({ startDate: undefined, endDate: undefined });
      return;
    }

    // Update both dates at once to prevent unnecessary refetches
    updateFilter({
      startDate: convertCalendarDateToJSDate(range.start),
      endDate: convertCalendarDateToJSDate(range.end),
    });
  };

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filter.name ?? ""}
          onChange={(value) => updateFilter({ name: value })}
          className="pl-8"
          placeholder="Filter by name"
        />
      </div>
      <DateRangePicker
        value={dateRangeValue}
        onChange={handleDateRangeChange}
      />
      {hasFilters && (
        <Button variant="ghost" size="sm" onPress={clearFilter} className="h-9 w-9">
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
