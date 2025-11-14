import * as React from "react";
import { DayPicker } from "react-day-picker";
import { cn } from "~/lib/cn";

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  selectedClassNames?: string;
};

export const Calendar = ({
  className,
  classNames,
  selectedClassNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) => <DayPicker
      weekStartsOn={1}
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "px-6",
        month_caption: "pb-2",
        nav: "flex items-center w-full absolute top-1/2 transform -translate-y-1/2 justify-between left-0 z-1",
        weekdays: "grid grid-cols-7",
        outside: "text-muted-foreground opacity-50",
        day: "btn btn-ghost h-9 w-9 p-0 font-normal aria-selected:opacity-100",
        day_button: "h-9 w-9 p-0 z-20 cursor-pointer relative",
        selected: cn(
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          selectedClassNames
        ),
        today: "bg-accent text-accent-foreground",
        disabled: "text-muted-foreground opacity-50",
        button_next: "btn btn-ghost px-2 mr-3",
        button_previous: "btn btn-ghost px-2 ml-3",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        ...classNames,
      }}
      {...props}
    />;
