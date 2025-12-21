import { X } from "lucide-react";
import { parseDate } from "@internationalized/date";
import type { RangeValue } from "@react-types/shared";
import type { DateValue } from "react-aria-components";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { DateRangePicker } from "~/components/ui/DateRangePicker";
import { cn } from "~/lib/cn";
import type { ShootFilterItem } from "./ShootFiltersContext";

type ShootFilterItemRendererProps = {
  item: ShootFilterItem;
  onChange: (item: ShootFilterItem) => void;
  onRemove: () => void;
};

const convertDateToCalendarDate = (jsDate: Date): DateValue => {
  const year = jsDate.getFullYear();
  const month = jsDate.getMonth() + 1;
  const day = jsDate.getDate();
  return parseDate(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
};

const convertCalendarDateToJSDate = (calendarDate: DateValue): Date => {
  const { year, month, day } = calendarDate as { year: number; month: number; day: number };
  return new Date(year, month - 1, day);
};

export const ShootFilterItemRenderer = ({
  item,
  onChange,
  onRemove,
}: ShootFilterItemRendererProps) => {
  const renderContent = () => {
    switch (item.type) {
      case "search":
        return (
          <Input
            value={item.value}
            onChange={(value) => onChange({ type: "search", value })}
            placeholder="Search shoots..."
            className="min-w-[200px]"
          />
        );

      case "dateRange": {
        const dateRangeValue: RangeValue<DateValue> | undefined =
          item.value.startDate && item.value.endDate
            ? {
                start: convertDateToCalendarDate(item.value.startDate),
                end: convertDateToCalendarDate(item.value.endDate),
              }
            : undefined;

        const handleDateRangeChange = (range: RangeValue<DateValue> | null) => {
          if (!range) {
            onChange({ type: "dateRange", value: { startDate: undefined, endDate: undefined } });
            return;
          }

          onChange({
            type: "dateRange",
            value: {
              startDate: convertCalendarDateToJSDate(range.start),
              endDate: convertCalendarDateToJSDate(range.end),
            },
          });
        };

        return (
          <DateRangePicker
            value={dateRangeValue}
            onChange={handleDateRangeChange}
            className="w-auto"
          />
        );
      }

      default:
        return null;
    }
  };

  const isDateRange = item.type === "dateRange";

  return (
    <div className="group relative flex items-center gap-1">
      {renderContent()}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-6 w-6 flex-shrink-0 rounded-full bg-base-100 hover:bg-error hover:text-error-content",
          "opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all",
          "border-0 hover:border-0 focus:border-0",
          "ring-0 hover:ring-0 focus:ring-0",
          "absolute top-1/2 -translate-y-1/2",
          isDateRange ? "right-14" : "right-[0.625rem]"
        )}
        onPress={onRemove}
        aria-label="Remove filter"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
};

