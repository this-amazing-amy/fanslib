import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { cn } from "~/lib/cn";
import { generateScheduleDates } from "@fanslib/server/schedule-dates";
import { useContentSchedulesQuery } from "~/lib/queries/content-schedules";
import { useScheduleHover } from "./ScheduleHoverContext";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEK_STARTS_ON_MONDAY = { weekStartsOn: 1 as const };

type ScheduleDot = {
  scheduleId: string;
  color: string;
};

export const ScheduleCalendarOverview = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { data: schedules } = useContentSchedulesQuery();
  const { hoveredScheduleId } = useScheduleHover();

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, WEEK_STARTS_ON_MONDAY);
    const lastDayOfMonthWeek = startOfWeek(addDays(monthEnd, 6), WEEK_STARTS_ON_MONDAY);
    const calendarEnd = addDays(lastDayOfMonthWeek, 6);
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd }).slice(0, 42);
  }, [currentMonth]);

  // For each schedule, compute which days in the current month have slots
  const dotsByDay = useMemo(() => {
    if (!schedules) return new Map<string, ScheduleDot[]>();

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    return schedules.reduce((map, schedule) => {
      const dates = generateScheduleDates(
        {
          type: schedule.type,
          postsPerTimeframe: schedule.postsPerTimeframe,
          preferredDays: schedule.preferredDays,
          preferredTimes: schedule.preferredTimes,
        },
        monthStart,
        monthEnd,
      );

      return dates.reduce((acc, date) => {
        const key = format(date, "yyyy-MM-dd");
        const existing = acc.get(key) ?? [];
        // Only add one dot per schedule per day
        if (!existing.some((d) => d.scheduleId === schedule.id)) {
          acc.set(key, [...existing, { scheduleId: schedule.id, color: schedule.color ?? "#6366f1" }]);
        }
        return acc;
      }, map);
    }, new Map<string, ScheduleDot[]>());
  }, [schedules, currentMonth]);

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <div className="flex flex-col h-full p-6">
      {/* Header with navigation */}
      <header className="flex items-center justify-between pb-6">
        <button
          type="button"
          onClick={goToPreviousMonth}
          className="btn btn-ghost btn-sm"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
        <button
          type="button"
          onClick={goToNextMonth}
          className="btn btn-ghost btn-sm"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </header>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 flex-1 border-t border-l border-base-300">
        {/* Weekday headers */}
        {WEEKDAY_LABELS.map((day) => (
          <div
            key={day}
            className="text-xs font-medium text-base-content/50 text-center py-2 border-r border-b border-base-300 bg-base-200/30"
          >
            {day}
          </div>
        ))}

        {/* Day cells */}
        {calendarDays.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dots = dotsByDay.get(key) ?? [];
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isTodayDate = isToday(day);

          return (
            <div
              key={key}
              className={cn(
                "border-r border-b border-base-300 p-2 min-h-[5rem] flex flex-col gap-1",
                !isCurrentMonth && "bg-base-200/20",
              )}
            >
              <span
                className={cn(
                  "text-sm leading-none",
                  !isCurrentMonth && "text-base-content/30",
                  isTodayDate &&
                    "bg-primary text-primary-content rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold",
                )}
              >
                {format(day, "d")}
              </span>

              {dots.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-auto">
                  {dots.map((dot) => (
                    <span
                      key={dot.scheduleId}
                      className={cn(
                        "w-2.5 h-2.5 rounded-full transition-opacity duration-150",
                        hoveredScheduleId !== null &&
                          hoveredScheduleId !== dot.scheduleId &&
                          "opacity-15",
                      )}
                      style={{ backgroundColor: dot.color }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
