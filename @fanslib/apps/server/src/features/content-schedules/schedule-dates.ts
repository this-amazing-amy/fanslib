import {
  addDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  endOfMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";

export type ScheduleType = "daily" | "weekly" | "monthly";

export type ScheduleConfig = {
  type: ScheduleType;
  postsPerTimeframe?: number | null;
  preferredDays?: string[] | null;
  preferredTimes?: string[] | null;
};

const WEEK_STARTS_ON_MONDAY = { weekStartsOn: 1 as const };

const DAY_NAME_TO_OFFSET: Record<string, number> = {
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4,
  Saturday: 5,
  Sunday: 6,
};

const applyTime = (date: Date, time?: string | null): Date => {
  const [hoursValue, minutesValue] = (time ?? "12:00").split(":");
  const parsedHours = Number(hoursValue);
  const parsedMinutes = Number(minutesValue);
  const next = new Date(date);
  next.setHours(Number.isNaN(parsedHours) ? 12 : parsedHours);
  next.setMinutes(Number.isNaN(parsedMinutes) ? 0 : parsedMinutes);
  next.setSeconds(0, 0);
  return next;
};

const distributeEvenly = (availableCount: number, desiredCount: number): number[] => {
  const count = Math.min(availableCount, desiredCount);
  return Array.from({ length: count }, (_, i) =>
    Math.floor((i * availableCount) / count)
  );
};

const selectEvenly = <T,>(items: T[], desiredCount: number): T[] => {
  if (items.length === 0) {
    return [];
  }
  const indices = distributeEvenly(items.length, desiredCount);
  return indices.map((index) => items[index]).filter((item): item is T => Boolean(item));
};

const sortDates = (dates: Date[]) =>
  [...dates].sort((a, b) => a.getTime() - b.getTime());

export const generateScheduleDates = (
  schedule: ScheduleConfig,
  startDate: Date,
  endDate: Date
): Date[] => {
  const postsPerTimeframe = schedule.postsPerTimeframe ?? 1;
  const preferredTimes = schedule.preferredTimes?.length ? schedule.preferredTimes : ["12:00"];

  if (schedule.type === "daily") {
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    return days.flatMap((day) =>
      selectEvenly(preferredTimes, postsPerTimeframe).map((time) =>
        applyTime(day, time)
      )
    );
  }

  if (schedule.type === "weekly") {
    const weeks = eachWeekOfInterval({ start: startDate, end: endDate }, WEEK_STARTS_ON_MONDAY);
    const hasPreferredDays = schedule.preferredDays?.length;

    return weeks.flatMap((week) => {
      const weekStart = startOfWeek(week, WEEK_STARTS_ON_MONDAY);
      const weekDays = hasPreferredDays
        ? schedule.preferredDays
            ?.map((day) => DAY_NAME_TO_OFFSET[day])
            .filter((offset): offset is number => offset !== undefined)
            .map((offset) => addDays(weekStart, offset)) ?? []
        : eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });

      const slots = weekDays.flatMap((day) =>
        preferredTimes.map((time) => applyTime(day, time))
      );
      return selectEvenly(
        sortDates(slots.filter((slot) => slot >= startDate && slot <= endDate)),
        postsPerTimeframe
      );
    });
  }

  if (schedule.type === "monthly") {
    const months = eachMonthOfInterval({ start: startDate, end: endDate });
    const hasPreferredDays = schedule.preferredDays?.length;

    return months.flatMap((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const monthDays = hasPreferredDays
        ? (() => {
            const monthWeeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, WEEK_STARTS_ON_MONDAY);
            const dayOffsets = schedule.preferredDays
              ?.map((day) => DAY_NAME_TO_OFFSET[day])
              .filter((offset): offset is number => offset !== undefined) ?? [];
            return dayOffsets.flatMap((offset) =>
              monthWeeks
                .map((w) => addDays(startOfWeek(w, WEEK_STARTS_ON_MONDAY), offset))
                .filter((date) => date >= monthStart && date <= monthEnd)
            );
          })()
        : eachDayOfInterval({ start: monthStart, end: monthEnd });

      const slots = monthDays.flatMap((date) =>
        preferredTimes.map((time) => applyTime(date, time))
      );
      return selectEvenly(
        sortDates(slots.filter((slot) => slot >= startDate && slot <= endDate)),
        postsPerTimeframe
      );
    });
  }

  return [];
};
