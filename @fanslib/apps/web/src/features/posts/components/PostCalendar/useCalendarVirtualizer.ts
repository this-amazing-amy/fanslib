import { useVirtualizer } from "@tanstack/react-virtual";
import { addMonths, endOfMonth, format, getDay, startOfMonth, startOfWeek } from "date-fns";
import { de } from "date-fns/locale";
import { useCallback, useEffect, useRef, useState } from "react";

type UseCalendarVirtualizerArgs = {
  initialDate?: Date;
  onVisibleRangeChange?: (startDate: Date, endDate: Date) => void;
};

type MonthItem = {
  key: string;
  date: Date;
};

const INITIAL_MONTHS_BEFORE = 1;
const INITIAL_MONTHS_AFTER = 2;
const MONTHS_TO_LOAD = 2;

// Calculate the number of rows needed to display a month
const getMonthRowCount = (monthDate: Date): number => {
  const firstDay = startOfMonth(monthDate);
  const lastDay = endOfMonth(monthDate);
  const weekStart = startOfWeek(firstDay, { locale: de });
  
  // Get the offset of the first day (0 = Monday for de locale)
  const firstDayOffset = (getDay(firstDay) - getDay(weekStart) + 7) % 7;
  const daysInMonth = lastDay.getDate();
  
  // Total cells needed = offset + days in month
  // Rows = ceil(totalCells / 7)
  return Math.ceil((firstDayOffset + daysInMonth) / 7);
};

// Calculate estimated height for a month based on its row count
const estimateMonthHeight = (monthDate: Date): number => {
  const rows = getMonthRowCount(monthDate);
  // Header: ~44px, margin: 16px, rows: 116px each (100px min-height + 16px gap), padding: 32px
  // Last row doesn't have gap after it, so subtract one gap
  return 44 + 16 + (rows * 116) - 16 + 32;
};

const generateMonthKey = (date: Date) => format(startOfMonth(date), "yyyy-MM");

const generateInitialMonths = (centerDate: Date): MonthItem[] => {
  const months: MonthItem[] = [];
  const start = addMonths(startOfMonth(centerDate), -INITIAL_MONTHS_BEFORE);

  const totalMonths = INITIAL_MONTHS_BEFORE + 1 + INITIAL_MONTHS_AFTER;
  Array.from({ length: totalMonths }).forEach((_, i) => {
    const date = addMonths(start, i);
    months.push({
      key: generateMonthKey(date),
      date: startOfMonth(date),
    });
  });

  return months;
};

export const useCalendarVirtualizer = ({
  initialDate = new Date(),
  onVisibleRangeChange,
}: UseCalendarVirtualizerArgs = {}) => {
  const scrollElementRef = useRef<HTMLDivElement | null>(null);
  const [months, setMonths] = useState<MonthItem[]>(() =>
    generateInitialMonths(initialDate)
  );
  const isLoadingRef = useRef(false);
  const initialScrollDoneRef = useRef(false);

  const virtualizer = useVirtualizer({
    count: months.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: (index) => estimateMonthHeight(months[index].date),
    overscan: 1,
    getItemKey: (index) => months[index].key,
  });

  const loadMoreMonthsAtEnd = useCallback(() => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    setMonths((prev) => {
      const lastMonth = prev[prev.length - 1];
      const newMonths = Array.from({ length: MONTHS_TO_LOAD }).map((_, i) => {
        const date = addMonths(lastMonth.date, i + 1);
        return {
          key: generateMonthKey(date),
          date: startOfMonth(date),
        };
      });
      return [...prev, ...newMonths];
    });

    // Small delay to prevent rapid loading
    setTimeout(() => {
      isLoadingRef.current = false;
    }, 100);
  }, []);

  const loadMoreMonthsAtStart = useCallback(() => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    const scrollElement = scrollElementRef.current;
    const currentScrollTop = scrollElement?.scrollTop ?? 0;

    setMonths((prev) => {
      const firstMonth = prev[0];
      const newMonths = Array.from({ length: MONTHS_TO_LOAD }).map((_, i) => {
        const date = addMonths(firstMonth.date, -(MONTHS_TO_LOAD - i));
        return {
          key: generateMonthKey(date),
          date: startOfMonth(date),
        };
      });
      return [...newMonths, ...prev];
    });

    // Maintain scroll position after prepending
    requestAnimationFrame(() => {
      if (scrollElement) {
        const newItemsHeight = MONTHS_TO_LOAD * 600; // Estimated
        scrollElement.scrollTop = currentScrollTop + newItemsHeight;
      }
      setTimeout(() => {
        isLoadingRef.current = false;
      }, 100);
    });
  }, []);

  // Handle scroll events to detect when to load more months
  useEffect(() => {
    const scrollElement = scrollElementRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      const scrollBottom = scrollHeight - scrollTop - clientHeight;

      // Load more at end when within 200px of bottom
      if (scrollBottom < 200) {
        loadMoreMonthsAtEnd();
      }

      // Load more at start when within 200px of top
      if (scrollTop < 200) {
        loadMoreMonthsAtStart();
      }
    };

    scrollElement.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollElement.removeEventListener("scroll", handleScroll);
  }, [loadMoreMonthsAtEnd, loadMoreMonthsAtStart]);

  // Initial scroll to center on the current month (index 1, after the "before" month)
  useEffect(() => {
    if (initialScrollDoneRef.current) return;
    
    const scrollElement = scrollElementRef.current;
    if (!scrollElement || months.length === 0) return;

    // Wait for virtualizer to be ready
    requestAnimationFrame(() => {
      const initialIndex = INITIAL_MONTHS_BEFORE; // Index of current month
      virtualizer.scrollToIndex(initialIndex, { align: "start" });
      initialScrollDoneRef.current = true;
    });
  }, [months.length, virtualizer]);

  // Get virtual items for tracking visible range
  const virtualItems = virtualizer.getVirtualItems();

  // Notify parent of visible date range changes
  useEffect(() => {
    if (!onVisibleRangeChange || months.length === 0) return;

    if (virtualItems.length === 0) return;

    const firstVisibleIndex = virtualItems[0].index;
    const lastVisibleIndex = virtualItems[virtualItems.length - 1].index;

    // Add buffer for data fetching (1 month before and after visible range)
    const fetchStartIndex = Math.max(0, firstVisibleIndex - 1);
    const fetchEndIndex = Math.min(months.length - 1, lastVisibleIndex + 1);

    const startDate = months[fetchStartIndex].date;
    const endDate = addMonths(months[fetchEndIndex].date, 1);

    onVisibleRangeChange(startDate, endDate);
  }, [virtualItems, months, onVisibleRangeChange]);

  return {
    scrollElementRef,
    virtualizer,
    months,
  };
};
