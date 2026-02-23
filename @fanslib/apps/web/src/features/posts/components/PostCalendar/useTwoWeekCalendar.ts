import {
  addDays,
  addWeeks,
  eachDayOfInterval,
  endOfDay,
  format,
  getMonth,
  getYear,
  isSameDay,
  isToday,
  startOfWeek,
  subWeeks,
} from "date-fns";
import { de } from "date-fns/locale";
import { useCallback, useMemo, useRef, useState } from "react";

export type WeekData = {
  days: Date[];
  monthLabel: string;
};

const weekStartOptions = { locale: de } as const;

const mondayOfCurrentWeek = () => startOfWeek(new Date(), weekStartOptions);

const monthLabel = (days: Date[]): string => {
  const months = days.reduce<Array<{ month: number; year: number }>>(
    (acc, day) => {
      const month = getMonth(day);
      const year = getYear(day);
      const exists = acc.some((m) => m.month === month && m.year === year);
      return exists ? acc : [...acc, { month, year }];
    },
    []
  );

  return months
    .map(({ month, year }) => format(new Date(year, month, 1), "MMMM"))
    .join(" / ");
};

const buildWeek = (weekStart: Date): WeekData => {
  const days = eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 6),
  });
  return { days, monthLabel: monthLabel(days) };
};

export const useTwoWeekCalendar = () => {
  const [firstWeekStart, setFirstWeekStart] = useState(mondayOfCurrentWeek);
  const directionRef = useRef<1 | -1>(1);

  const weeks = useMemo<[WeekData, WeekData]>(() => {
    const secondWeekStart = addWeeks(firstWeekStart, 1);
    return [buildWeek(firstWeekStart), buildWeek(secondWeekStart)];
  }, [firstWeekStart]);

  const visibleRange = useMemo(
    () => ({
      startDate: firstWeekStart,
      endDate: endOfDay(addDays(firstWeekStart, 13)),
    }),
    [firstWeekStart]
  );

  const pageDown = useCallback(() => {
    directionRef.current = 1;
    setFirstWeekStart((prev) => addWeeks(prev, 1));
  }, []);

  const pageUp = useCallback(() => {
    directionRef.current = -1;
    setFirstWeekStart((prev) => subWeeks(prev, 1));
  }, []);

  const jumpToToday = useCallback(() => {
    const today = mondayOfCurrentWeek();
    directionRef.current = today > firstWeekStart ? 1 : -1;
    setFirstWeekStart(today);
  }, [firstWeekStart]);

  const todayInView = useMemo(
    () => weeks.some((week) => week.days.some((day) => isToday(day))),
    [weeks]
  );

  const containsDay = useCallback(
    (date: Date) =>
      weeks.some((week) => week.days.some((day) => isSameDay(day, date))),
    [weeks]
  );

  return {
    weeks,
    visibleRange,
    pageDown,
    pageUp,
    jumpToToday,
    todayInView,
    containsDay,
    direction: directionRef,
    pageKey: firstWeekStart.getTime(),
  };
};
