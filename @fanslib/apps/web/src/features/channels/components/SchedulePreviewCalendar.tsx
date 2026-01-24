import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { cn } from "~/lib/cn";
import { generateScheduleDates, type ScheduleType } from "@fanslib/server/schedule-dates";

type SchedulePreviewCalendarProps = {
  type: ScheduleType;
  postsPerTimeframe: number;
  preferredDays: string[];
  preferredTimes: string[];
};

const WEEKDAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const WEEK_STARTS_ON_MONDAY = { weekStartsOn: 1 as const };

export const SchedulePreviewCalendar = ({
  type,
  postsPerTimeframe,
  preferredDays,
  preferredTimes,
}: SchedulePreviewCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = new Date();

  const scheduledDates = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    return generateScheduleDates(
      { type, postsPerTimeframe, preferredDays, preferredTimes },
      monthStart,
      monthEnd
    );
  }, [type, postsPerTimeframe, preferredDays, preferredTimes, currentMonth]);

  const isDateInFuture = (date: Date): boolean => {
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    return dateStart >= todayStart;
  };

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, WEEK_STARTS_ON_MONDAY);
    const lastDayOfMonthWeek = startOfWeek(addDays(monthEnd, 6), WEEK_STARTS_ON_MONDAY);
    const calendarEnd = addDays(lastDayOfMonthWeek, 6);
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd }).slice(0, 42);
  }, [currentMonth]);

  const isScheduled = (date: Date) =>
    scheduledDates.some((scheduled) => isSameDay(scheduled, date));

  const countOnDate = (date: Date) =>
    scheduledDates.filter((scheduled) => isSameDay(scheduled, date)).length;

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <div className="border border-base-300 rounded-lg p-3 bg-base-100">
      <header className="flex items-center justify-between pb-2">
        <button
          type="button"
          onClick={goToPreviousMonth}
          className="btn btn-ghost btn-sm"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-medium">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <span className="text-xs text-base-content/60">
            {scheduledDates.length} post{scheduledDates.length !== 1 ? "s" : ""} this month
          </span>
        </div>
        <button
          type="button"
          onClick={goToNextMonth}
          className="btn btn-ghost btn-sm"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </header>

      <div className="grid grid-cols-7 gap-1 justify-items-center">
        {WEEKDAY_LABELS.map((day) => (
          <div
            key={day}
            className="text-xs font-normal text-base-content/50 p-1 text-center"
          >
            {day}
          </div>
        ))}

        {calendarDays.map((day) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isScheduledDate = isScheduled(day);
          const isFutureDate = isDateInFuture(day);
          const scheduled = isScheduledDate && isFutureDate;
          const scheduledPast = isScheduledDate && !isFutureDate;
          const count = countOnDate(day);
          const isTodayDate = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "h-9 w-9 p-0 font-normal flex items-center justify-center text-sm relative",
                !isCurrentMonth && "text-base-content/30",
                scheduled && isCurrentMonth && "bg-primary text-primary-content rounded-lg",
                scheduledPast && isCurrentMonth && "bg-base-300 text-base-content rounded-lg",
                isTodayDate && isCurrentMonth && "ring-2 ring-base-content ring-offset-2 ring-offset-base-100 rounded-lg"
              )}
            >
              {format(day, "d")}
              {count > 1 && isCurrentMonth && (scheduled || scheduledPast) && (
                <span className={cn(
                  "absolute -top-1 -right-1 text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold",
                  scheduled && "bg-primary-content text-primary",
                  scheduledPast && "bg-base-content text-base-300"
                )}>
                  {count}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
