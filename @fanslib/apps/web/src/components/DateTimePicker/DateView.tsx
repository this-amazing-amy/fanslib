import { CalendarDate } from "@internationalized/date";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { I18nProvider } from "react-aria";
import {
  Button as AriaButton,
  Calendar as AriaCalendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
} from "react-aria-components";
import { Button } from "~/components/ui/Button";
import { cn } from "~/lib/cn";

type DateViewProps = {
  date: Date;
  minValue?: Date;
  handleCalendarChange: (newDate: CalendarDate | null) => void;
  switchToTimeMode: () => void;
  switchToYearMode: () => void;
  setToToday: () => void;
  currentTime: string;
  currentDate: string;
  view: "date" | "time" | "year";
};

export const DateView = ({
  date,
  minValue,
  handleCalendarChange,
  switchToTimeMode,
  switchToYearMode,
  setToToday,
  currentTime,
  view,
}: DateViewProps) => (
  <div
    className={cn(
      "flex flex-col absolute inset-0 p-3",
      view === "date" ? "pointer-events-auto" : "pointer-events-none",
    )}
    style={{ visibility: view === "date" ? "visible" : "hidden" }}
  >
    <div>
      <I18nProvider locale="de-DE">
        <AriaCalendar
          value={new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())}
          onChange={handleCalendarChange}
          minValue={
            minValue
              ? new CalendarDate(
                  minValue.getFullYear(),
                  minValue.getMonth() + 1,
                  minValue.getDate(),
                )
              : undefined
          }
          className="p-3"
        >
          <header className="flex items-center justify-between pb-2">
            <AriaButton slot="previous" className="btn btn-ghost btn-sm">
              <ChevronLeft className="h-4 w-4" />
            </AriaButton>
            <button
              type="button"
              onClick={switchToYearMode}
              className="text-sm font-medium hover:opacity-80 transition-opacity cursor-pointer"
            >
              {format(date, "MMMM yyyy")}
            </button>
            <AriaButton slot="next" className="btn btn-ghost btn-sm">
              <ChevronRight className="h-4 w-4" />
            </AriaButton>
          </header>
          <CalendarGrid className="w-full border-collapse">
            <CalendarGridHeader>
              {(day) => (
                <CalendarHeaderCell className="text-xs font-normal text-base-content/50 p-1">
                  {day}
                </CalendarHeaderCell>
              )}
            </CalendarGridHeader>
            <CalendarGridBody>
              {(date) => (
                <CalendarCell
                  date={date}
                  className={cn(
                    "h-9 w-9 p-0 font-normal cursor-pointer flex items-center justify-center text-sm",
                    "outline-none",
                    "hover:bg-base-200",
                    "data-[selected]:bg-primary data-[selected]:text-primary-content data-[selected]:rounded-lg",
                    "data-[outside-month]:text-base-content/30",
                    "data-[disabled]:text-base-content/30 data-[disabled]:cursor-not-allowed",
                    "data-[unavailable]:text-error data-[unavailable]:line-through",
                  )}
                />
              )}
            </CalendarGridBody>
          </CalendarGrid>
        </AriaCalendar>
      </I18nProvider>
    </div>
    <div className="flex justify-center pb-2">
      <Button size="sm" variant="ghost" onPress={setToToday}>
        Today
      </Button>
    </div>
    <div className="border-t border-border pt-3 mt-auto">
      <Button
        variant="ghost"
        onPress={switchToTimeMode}
        className="w-full justify-center text-center font-bold transition-opacity hover:opacity-80 text-xl"
      >
        <span>{currentTime}</span>
      </Button>
    </div>
  </div>
);
