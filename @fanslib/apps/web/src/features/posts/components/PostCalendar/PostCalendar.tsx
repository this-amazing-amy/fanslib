import type { PostWithRelations } from "@fanslib/server/schemas";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { Button } from "~/components/ui/Button";
import { cn } from "~/lib/cn";
import { CalendarDayColumn } from "./CalendarDayColumn";
import { useHorizontalCalendar } from "./useHorizontalCalendar";

type Post = PostWithRelations;

export type PostCalendarHandle = {
  scrollToToday: () => void;
};

type PostCalendarProps = {
  className?: string;
  posts: Post[];
  onUpdate: () => Promise<void>;
  onVisibleRangeChange?: (startDate: Date, endDate: Date) => void;
  isLoading?: boolean;
};

export const PostCalendar = forwardRef<PostCalendarHandle, PostCalendarProps>(
  ({ className, posts, onUpdate, onVisibleRangeChange }, ref) => {
    const {
      days,
      visibleDaysCount,
      containerRef,
      scrollLeft,
      scrollRight,
      scrollToToday,
      visibleRange,
      currentMonthLabel,
    } = useHorizontalCalendar();

    useImperativeHandle(ref, () => ({ scrollToToday }));

    // Debounce range change notifications so fast scrolling doesn't cascade refetches
    const rangeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    useEffect(() => {
      clearTimeout(rangeTimerRef.current);
      rangeTimerRef.current = setTimeout(() => {
        onVisibleRangeChange?.(visibleRange.startDate, visibleRange.endDate);
      }, 200);
      return () => clearTimeout(rangeTimerRef.current);
    }, [visibleRange, onVisibleRangeChange]);

    const visiblePosts = useMemo(
      () =>
        posts.filter((post) => {
          const d = new Date(post.date).getTime();
          return (
            d >= visibleRange.startDate.getTime() &&
            d <= visibleRange.endDate.getTime()
          );
        }),
      [posts, visibleRange]
    );

    const isSingleDay = visibleDaysCount === 1;
    const dayWidthPercent = 100 / visibleDaysCount;

    return (
      <div className={cn("relative h-full", className)}>
        {/* Calendar */}
        <div className="flex flex-col h-full min-h-0">
          <div className="flex items-center justify-between px-1 mb-2 flex-shrink-0">
            <h3 className="text-base font-semibold text-base-content/90">
              {currentMonthLabel}
            </h3>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onPress={scrollLeft}
                aria-label="Previous day"
                className="rounded-full"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onPress={scrollToToday}
                aria-label="Jump to today"
                className="rounded-full"
              >
                <CalendarDays className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onPress={scrollRight}
                aria-label="Next day"
                className="rounded-full"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Scroll container with fade edges */}
          <div className="relative flex-1 min-h-0">
            <div
              ref={containerRef}
              className="h-full overflow-x-auto overflow-y-hidden scrollbar-none"
              style={{ scrollSnapType: "x mandatory" }}
            >
              <div
                className="flex h-full"
                style={{ width: `${(days.length / visibleDaysCount) * 100}%` }}
              >
                {days.map((day) => (
                  <CalendarDayColumn
                    key={day.toISOString()}
                    day={day}
                    posts={visiblePosts}
                    allPosts={posts}
                    onUpdate={onUpdate}
                    style={{
                      width: `${dayWidthPercent / (days.length / visibleDaysCount)}%`,
                      ...(isSingleDay && { scrollSnapAlign: "center" }),
                    }}
                  />
                ))}
              </div>
            </div>
            {/* Left fade */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-base-100 to-transparent" />
            {/* Right fade */}
            <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-base-100 to-transparent" />
          </div>
        </div>
      </div>
    );
  }
);

PostCalendar.displayName = "PostCalendar";
