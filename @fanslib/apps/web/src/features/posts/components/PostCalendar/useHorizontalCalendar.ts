import {
  addDays,
  eachDayOfInterval,
  endOfDay,
  format,
  getMonth,
  getYear,
  isToday,
  startOfWeek,
  subDays,
} from "date-fns";
import { de } from "date-fns/locale";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";

const weekStartOptions = { locale: de } as const;

const VISIBLE_DAYS = 7;
const BUFFER_DAYS = 21;

const mondayOfCurrentWeek = () => startOfWeek(new Date(), weekStartOptions);

const buildInitialDays = (anchor: Date): Date[] =>
  eachDayOfInterval({
    start: subDays(anchor, BUFFER_DAYS),
    end: addDays(anchor, VISIBLE_DAYS - 1 + BUFFER_DAYS),
  });

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
    .map(({ month, year }) => format(new Date(year, month, 1), "MMMM yyyy"))
    .join(" / ");
};

export type UseHorizontalCalendarReturn = {
  days: Date[];
  containerRef: RefObject<HTMLDivElement | null>;
  scrollLeft: () => void;
  scrollRight: () => void;
  scrollToToday: () => void;
  todayInView: boolean;
  visibleRange: { startDate: Date; endDate: Date };
  currentMonthLabel: string;
};

export const useHorizontalCalendar = (): UseHorizontalCalendarReturn => {
  const anchor = useRef(mondayOfCurrentWeek());
  const [days, setDays] = useState(() => buildInitialDays(anchor.current));
  const containerRef = useRef<HTMLDivElement | null>(null);
  const containerWidthRef = useRef(0);
  const firstVisibleIndexRef = useRef(BUFFER_DAYS);
  const [firstVisibleIndex, setFirstVisibleIndex] = useState(BUFFER_DAYS);
  const isExtendingRef = useRef(false);

  // Measure container width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) containerWidthRef.current = entry.contentRect.width;
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Initial scroll to buffer offset
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const dayWidth = el.scrollWidth / days.length;
    el.scrollLeft = BUFFER_DAYS * dayWidth;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll event listener
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const totalWidth = el.scrollWidth;
      const dayWidth = totalWidth / days.length;
      if (dayWidth === 0) return;

      const idx = Math.round(el.scrollLeft / dayWidth);
      if (idx !== firstVisibleIndexRef.current) {
        firstVisibleIndexRef.current = idx;
        setFirstVisibleIndex(idx);
      }

      // Extend buffer when near edges
      if (!isExtendingRef.current) {
        const nearStart = el.scrollLeft < dayWidth * 3;
        const nearEnd =
          el.scrollLeft + el.clientWidth > totalWidth - dayWidth * 3;

        if (nearStart) {
          isExtendingRef.current = true;
          const currentScrollLeft = el.scrollLeft;
          const prependCount = 7;
          const firstDay = days[0];
          const newDays = eachDayOfInterval({
            start: subDays(firstDay, prependCount),
            end: subDays(firstDay, 1),
          });

          setDays((prev) => [...newDays, ...prev]);

          // Compensate scroll position after prepend
          requestAnimationFrame(() => {
            const newDayWidth = el.scrollWidth / (days.length + prependCount);
            el.scrollLeft = currentScrollLeft + prependCount * newDayWidth;
            firstVisibleIndexRef.current = Math.round(
              el.scrollLeft / newDayWidth
            );
            setFirstVisibleIndex(firstVisibleIndexRef.current);
            isExtendingRef.current = false;
          });
        } else if (nearEnd) {
          isExtendingRef.current = true;
          const appendCount = 7;
          const lastDay = days[days.length - 1];
          const newDays = eachDayOfInterval({
            start: addDays(lastDay, 1),
            end: addDays(lastDay, appendCount),
          });

          setDays((prev) => [...prev, ...newDays]);
          requestAnimationFrame(() => {
            isExtendingRef.current = false;
          });
        }
      }
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [days]);

  const getDayWidth = useCallback(() => {
    const el = containerRef.current;
    if (!el) return 0;
    return el.scrollWidth / days.length;
  }, [days.length]);

  const scrollLeftFn = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const dayWidth = getDayWidth();
    el.scrollBy({ left: -dayWidth, behavior: "smooth" });
  }, [getDayWidth]);

  const scrollRightFn = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const dayWidth = getDayWidth();
    el.scrollBy({ left: dayWidth, behavior: "smooth" });
  }, [getDayWidth]);

  const scrollToToday = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayIdx = days.findIndex(
      (d) => d.getTime() === todayStart.getTime()
    );

    // Center today in the 7-day viewport (offset by 3)
    const centerOffset = Math.floor(VISIBLE_DAYS / 2);

    if (todayIdx >= 0) {
      const dayWidth = getDayWidth();
      const targetIdx = Math.max(0, todayIdx - centerOffset);
      el.scrollTo({ left: targetIdx * dayWidth, behavior: "smooth" });
    } else {
      // Today not in buffer — reset centered on today
      const centeredAnchor = subDays(todayStart, centerOffset);
      anchor.current = centeredAnchor;
      const newDays = buildInitialDays(centeredAnchor);
      setDays(newDays);
      requestAnimationFrame(() => {
        if (!el) return;
        const dayWidth = el.scrollWidth / newDays.length;
        el.scrollLeft = BUFFER_DAYS * dayWidth;
        firstVisibleIndexRef.current = BUFFER_DAYS;
        setFirstVisibleIndex(BUFFER_DAYS);
      });
    }
  }, [days, getDayWidth]);

  const visibleDays = useMemo(
    () => days.slice(firstVisibleIndex, firstVisibleIndex + VISIBLE_DAYS),
    [days, firstVisibleIndex]
  );

  const todayInView = useMemo(
    () => visibleDays.some((d) => isToday(d)),
    [visibleDays]
  );

  const visibleRange = useMemo(
    () => ({
      startDate: visibleDays[0] ?? days[0],
      endDate: endOfDay(
        visibleDays[visibleDays.length - 1] ?? days[days.length - 1]
      ),
    }),
    [visibleDays, days]
  );

  const currentMonthLabel = useMemo(
    () => monthLabel(visibleDays),
    [visibleDays]
  );

  return {
    days,
    containerRef,
    scrollLeft: scrollLeftFn,
    scrollRight: scrollRightFn,
    scrollToToday,
    todayInView,
    visibleRange,
    currentMonthLabel,
  };
};
