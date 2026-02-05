import { addMonths, endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { useCallback, useEffect, useRef, useState } from "react";

type MonthData = {
  key: string;
  date: Date;
};

type UseInfiniteCalendarOptions = {
  initialDate?: Date;
  onVisibleRangeChange?: (start: Date, end: Date) => void;
};

const createMonthKey = (date: Date) => format(startOfMonth(date), "yyyy-MM");

const createMonthData = (date: Date): MonthData => ({
  key: createMonthKey(date),
  date: startOfMonth(date),
});

export const useInfiniteCalendar = ({
  initialDate = new Date(),
  onVisibleRangeChange,
}: UseInfiniteCalendarOptions = {}) => {
  // Initialize with 1 month before and 2 months after current
  const [months, setMonths] = useState<MonthData[]>(() => {
    const start = startOfMonth(initialDate);
    return [
      createMonthData(subMonths(start, 1)),
      createMonthData(start),
      createMonthData(addMonths(start, 1)),
      createMonthData(addMonths(start, 2)),
    ];
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);
  const monthRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const todayRef = useRef<HTMLDivElement>(null);
  const hasInitializedScrollRef = useRef(false);

  // Track which months we've already loaded to prevent duplicates
  const loadedMonthsRef = useRef<Set<string>>(new Set(months.map((m) => m.key)));

  const loadMoreMonths = useCallback((direction: "before" | "after") => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    setMonths((prev) => {
      const newMonths =
        direction === "before"
          ? [
              createMonthData(subMonths(prev[0].date, 2)),
              createMonthData(subMonths(prev[0].date, 1)),
            ]
          : [
              createMonthData(addMonths(prev[prev.length - 1].date, 1)),
              createMonthData(addMonths(prev[prev.length - 1].date, 2)),
            ];

      // Filter out any months we've already loaded
      const uniqueNewMonths = newMonths.filter(
        (m) => !loadedMonthsRef.current.has(m.key)
      );

      uniqueNewMonths.forEach((m) => loadedMonthsRef.current.add(m.key));

      if (uniqueNewMonths.length === 0) {
        isLoadingRef.current = false;
        return prev;
      }

      const result =
        direction === "before"
          ? [...uniqueNewMonths, ...prev]
          : [...prev, ...uniqueNewMonths];

      // Sort by date to ensure correct order
      result.sort((a, b) => a.date.getTime() - b.date.getTime());

      return result;
    });

    // Reset loading flag after a short delay
    setTimeout(() => {
      isLoadingRef.current = false;
    }, 100);
  }, []);

  const registerMonthRef = useCallback(
    (key: string, element: HTMLDivElement | null) => {
      if (element) {
        monthRefs.current.set(key, element);
      } else {
        monthRefs.current.delete(key);
      }
    },
    []
  );

  const scrollToToday = useCallback(() => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      // If today element isn't rendered, scroll to current month
      const todayMonthKey = createMonthKey(new Date());
      const monthElement = monthRefs.current.get(todayMonthKey);
      if (monthElement) {
        monthElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, []);

  // Handle scroll to load more months
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // On first render, scroll to the current month before enabling scroll triggers
    if (!hasInitializedScrollRef.current) {
      const currentMonthKey = createMonthKey(initialDate);
      const monthElement = monthRefs.current.get(currentMonthKey);
      if (monthElement) {
        monthElement.scrollIntoView({ block: "start" });
        hasInitializedScrollRef.current = true;
      }
    }

    const handleScroll = () => {
      // Don't trigger loadMore until we've initialized the scroll position
      if (!hasInitializedScrollRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = container;

      // Load more at top
      if (scrollTop < 300) {
        loadMoreMonths("before");
      }

      // Load more at bottom
      if (scrollHeight - scrollTop - clientHeight < 500) {
        loadMoreMonths("after");
      }

      // Update visible range for data fetching
      if (onVisibleRangeChange && months.length > 0) {
        const containerRect = container.getBoundingClientRect();
        const visibleMonths = months.filter((month) => {
          const element = monthRefs.current.get(month.key);
          if (!element) return false;

          const rect = element.getBoundingClientRect();
          return rect.bottom > containerRect.top && rect.top < containerRect.bottom;
        });

        if (visibleMonths.length > 0) {
          const firstVisibleMonth = visibleMonths[0].date;
          const lastVisibleMonth = visibleMonths[visibleMonths.length - 1].date;
          onVisibleRangeChange(
            startOfMonth(firstVisibleMonth),
            endOfMonth(lastVisibleMonth)
          );
        }
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    // Initial check
    handleScroll();

    return () => container.removeEventListener("scroll", handleScroll);
  }, [initialDate, loadMoreMonths, months, onVisibleRangeChange]);

  return {
    months,
    containerRef,
    registerMonthRef,
    todayRef,
    scrollToToday,
  };
};
