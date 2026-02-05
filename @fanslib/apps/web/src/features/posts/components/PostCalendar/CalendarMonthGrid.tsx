import type { PostWithRelations } from '@fanslib/server/schemas';
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { de } from "date-fns/locale";
import { memo, type RefObject } from "react";
import { cn } from "~/lib/cn";
import { PostCalendarDayContainer } from "./PostCalendarDayContainer";
import { PostCalendarDayDropzone } from "./PostCalendarDayDropzone";
import { PostCalendarPost } from "./PostCalendarPost";

type Post = PostWithRelations;

type CalendarMonthGridProps = {
  monthDate: Date;
  posts: Post[];
  onUpdate: () => Promise<void>;
  todayRef?: RefObject<HTMLDivElement | null>;
};

const colStartClasses = [
  "",
  "col-start-2",
  "col-start-3",
  "col-start-4",
  "col-start-5",
  "col-start-6",
  "col-start-7",
];

export const CalendarMonthGrid = memo(({ monthDate, posts, onUpdate, todayRef }: CalendarMonthGridProps) => {
  const firstDayOfMonth = startOfMonth(monthDate);
  const weekStart = startOfWeek(firstDayOfMonth, { locale: de });

  const days = eachDayOfInterval({
    start: firstDayOfMonth,
    end: endOfMonth(firstDayOfMonth),
  });

  const getDayOffset = (date: Date) => {
    const firstDayOffset = getDay(weekStart);
    const currentDayOffset = getDay(date);
    return (currentDayOffset - firstDayOffset + 7) % 7;
  };

  // Filter posts for this month
  const monthPosts = posts.filter((post) => isSameMonth(new Date(post.date), monthDate));

  return (
    <div className="w-full">
      {/* Month header */}
      <h2 className="text-2xl font-bold text-base-content mb-4">
        {format(firstDayOfMonth, "MMMM yyyy")}
      </h2>

      {/* Days grid */}
      <div className="grid grid-cols-7 text-sm gap-4">
        {days.map((day, dayIdx) => {
          const dayPosts = monthPosts.filter((post) => isSameDay(new Date(post.date), day));
          const isTodayDay = isToday(day);

          return (
            <PostCalendarDayContainer
              key={day.toString()}
              date={day}
              onUpdate={onUpdate}
              className={cn(
                dayIdx === 0 && colStartClasses[getDayOffset(day)],
                "flex flex-col min-h-[100px] rounded-lg p-2",
                isTodayDay && "bg-base-200 ring-2 ring-primary/50"
              )}
            >
              <div ref={isTodayDay ? todayRef : undefined}>
                {/* Day header */}
                <div className="flex items-center gap-1.5 mb-2 flex-shrink-0">
                  <time
                    dateTime={format(day, "yyyy-MM-dd")}
                    className={cn(
                      "font-medium text-sm w-6 h-6 flex items-center justify-center",
                      isTodayDay && "bg-primary text-primary-content rounded-full"
                    )}
                  >
                    {format(day, "d")}
                  </time>
                  <span className="text-xs text-base-content/60">{format(day, "EEE")}</span>
                </div>
              </div>
              {dayPosts.length > 0 && (
                <div className="flex-1 min-h-0 flex flex-col gap-2">
                  {dayPosts.map((post) => (
                    <PostCalendarPost
                      key={post.id}
                      onUpdate={onUpdate}
                      post={post}
                      allPosts={posts}
                    />
                  ))}
                </div>
              )}
              <PostCalendarDayDropzone date={day} onUpdate={onUpdate} />
            </PostCalendarDayContainer>
          );
        })}
      </div>
    </div>
  );
});

CalendarMonthGrid.displayName = 'CalendarMonthGrid';
