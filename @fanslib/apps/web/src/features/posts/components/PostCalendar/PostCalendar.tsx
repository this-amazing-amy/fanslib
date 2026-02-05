import type { PostWithRelations } from '@fanslib/server/schemas';
import { forwardRef, useImperativeHandle } from "react";
import { cn } from "~/lib/cn";
import { CalendarMonthGrid } from "./CalendarMonthGrid";
import { CalendarMonthSkeleton } from "./CalendarMonthSkeleton";
import { useInfiniteCalendar } from "./useInfiniteCalendar";

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
  ({ className, posts, onUpdate, onVisibleRangeChange, isLoading }, ref) => {
    const { containerRef, months, registerMonthRef, todayRef, scrollToToday } = useInfiniteCalendar({
      onVisibleRangeChange,
    });

    useImperativeHandle(ref, () => ({
      scrollToToday,
    }));

    return (
      <div
        ref={containerRef}
        className={cn("w-full h-full overflow-y-auto", className)}
      >
        <div className="flex flex-col gap-8 pb-8">
          {months.map((month) => (
            <div
              key={month.key}
              ref={(el) => registerMonthRef(month.key, el)}
            >
              {isLoading && posts.length === 0 ? (
                <CalendarMonthSkeleton monthDate={month.date} />
              ) : (
                <CalendarMonthGrid
                  monthDate={month.date}
                  posts={posts}
                  onUpdate={onUpdate}
                  todayRef={todayRef}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }
);

PostCalendar.displayName = "PostCalendar";

