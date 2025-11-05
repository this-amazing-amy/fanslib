import { useCallback, useEffect, useRef, useState } from "react";
import type { GridSize } from "~/contexts/LibraryPreferencesContext";

type GridBreakpoint = {
  minWidth: number;
  columns: number;
};

const getGridBreakpoints = (gridSize: GridSize): GridBreakpoint[] => {
  if (gridSize === "large") {
    return [
      { minWidth: 0, columns: 3 },
      { minWidth: 768, columns: 4 }, // 48rem
      { minWidth: 1152, columns: 6 }, // 72rem
      { minWidth: 2048, columns: 8 }, // 128rem
    ];
  } else {
    return [
      { minWidth: 0, columns: 3 },
      { minWidth: 768, columns: 4 }, // 48rem
      { minWidth: 1152, columns: 8 }, // 72rem
      { minWidth: 2048, columns: 12 }, // 128rem
    ];
  }
};

const calculateColumnsForWidth = (width: number, gridSize: GridSize): number => {
  const breakpoints = getGridBreakpoints(gridSize);

  // Find the appropriate breakpoint for the current width
  // eslint-disable-next-line functional/no-let
  let columns = breakpoints[0]?.columns ?? 3;

  breakpoints.forEach((breakpoint) => {
    if (width >= breakpoint.minWidth) {
      columns = breakpoint.columns;
    }
  });

  return columns;
};

const calculateRowsForHeight = (
  containerHeight: number,
  containerWidth: number,
  columns: number
): number => {
  if (containerHeight <= 0 || containerWidth <= 0 || columns <= 0) return 4; // Default fallback

  const gridPadding = 16; // p-4 = 16px on each side
  const gridGap = 16; // gap-4 = 16px

  // Calculate available space
  const availableWidth = containerWidth - gridPadding * 2;
  const availableHeight = containerHeight - gridPadding * 2;

  // Calculate item width (accounting for gaps between columns)
  const totalGapWidth = (columns - 1) * gridGap;
  const itemWidth = (availableWidth - totalGapWidth) / columns;

  // Items are aspect-square, so height = width
  const itemHeight = itemWidth;

  // Calculate how many rows can fit (accounting for gaps between rows)
  const rowsWithoutGaps = availableHeight / itemHeight;
  const maxPossibleRows = Math.floor(rowsWithoutGaps);

  // Account for gaps between rows
  const totalRowsWithGaps = Math.floor((availableHeight + gridGap) / (itemHeight + gridGap));

  // Use the more conservative calculation and ensure minimum of 2 rows
  const calculatedRows = Math.min(maxPossibleRows, totalRowsWithGaps);

  return Math.max(2, Math.min(calculatedRows, 8)); // Min 2 rows, max 8 rows
};

const calculateOptimalPageSize = (
  containerWidth: number,
  containerHeight: number,
  gridSize: GridSize
): number => {
  if (containerWidth <= 0 || containerHeight <= 0) return 50; // Default fallback

  const columns = calculateColumnsForWidth(containerWidth, gridSize);
  const rows = calculateRowsForHeight(containerHeight, containerWidth, columns);

  const pageSize = columns * rows;

  return Math.max(pageSize, 12); // Minimum 12 items
};

export const useDynamicPageSize = (
  containerRef: React.RefObject<HTMLElement | null>,
  gridSize: GridSize
) => {
  const [pageSize, setPageSize] = useState(
    () => calculateOptimalPageSize(1024, 600, gridSize) // Default fallback
  );

  const debounceRef = useRef<number | undefined>(undefined);

  const updatePageSize = useCallback(() => {
    if (!containerRef?.current) return;

    if (debounceRef.current !== undefined) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      if (!containerRef.current) return;

      const width = containerRef.current.offsetWidth;
      const height = containerRef.current.offsetHeight;
      const newPageSize = calculateOptimalPageSize(width, height, gridSize);

      setPageSize((prev) => {
        // Only update if the new page size is significantly different
        if (Math.abs(newPageSize - prev) >= 4) {
          return newPageSize;
        }
        return prev;
      });
    }, 100);
  }, [containerRef, gridSize]);

  useEffect(() => {
    updatePageSize();
  }, [updatePageSize]);

  useEffect(() => {
    if (!containerRef?.current) return () => {};

    const resizeObserver = new ResizeObserver(updatePageSize);
    resizeObserver.observe(containerRef?.current);

    return () => {
      resizeObserver.disconnect();
      if (debounceRef.current !== undefined) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [updatePageSize, containerRef]);

  return { pageSize, updatePageSize };
};
