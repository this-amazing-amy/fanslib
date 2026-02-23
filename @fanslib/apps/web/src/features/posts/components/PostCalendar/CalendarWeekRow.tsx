import type { PostWithRelations } from "@fanslib/server/schemas";
import { format, isSameDay, isToday } from "date-fns";
import { memo } from "react";
import { cn } from "~/lib/cn";
import { PostCalendarDayContainer } from "./PostCalendarDayContainer";
import { PostCalendarDayDropzone } from "./PostCalendarDayDropzone";
import { PostCalendarPost } from "./PostCalendarPost";
import type { WeekData } from "./useTwoWeekCalendar";

type Post = PostWithRelations;

type CalendarWeekRowProps = {
  week: WeekData;
  posts: Post[];
  onUpdate: () => Promise<void>;
};

const postsForDay = (posts: Post[], day: Date) =>
  posts.filter((post) => isSameDay(new Date(post.date), day));

export const CalendarWeekRow = memo(
  ({ week, posts, onUpdate }: CalendarWeekRowProps) => (
    <div className="flex flex-col min-h-0 flex-1">
      <h3 className="text-base font-semibold text-base-content/90 px-1 mb-2 flex-shrink-0">
        {week.monthLabel}
      </h3>

      <div className="grid grid-cols-7 gap-1.5 flex-1 min-h-0">
        {week.days.map((day) => {
          const dayPosts = postsForDay(posts, day);
          const today = isToday(day);

          return (
            <PostCalendarDayContainer
              key={day.toISOString()}
              date={day}
              onUpdate={onUpdate}
              className={cn(
                "flex flex-col min-h-0 rounded-lg p-1.5",
                today && "bg-base-200 ring-2 ring-primary/50"
              )}
            >
              <div className="flex items-center gap-1 mb-1 flex-shrink-0">
                <time
                  dateTime={format(day, "yyyy-MM-dd")}
                  className={cn(
                    "font-medium text-xs w-5 h-5 flex items-center justify-center",
                    today && "bg-primary text-primary-content rounded-full"
                  )}
                >
                  {format(day, "d")}
                </time>
                <span className="text-[10px] text-base-content/50">
                  {format(day, "EEE")}
                </span>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-thin">
                {dayPosts.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {dayPosts.map((post) => (
                      <PostCalendarPost
                        key={post.id}
                        post={post}
                        onUpdate={onUpdate}
                        allPosts={posts}
                      />
                    ))}
                  </div>
                )}
                <PostCalendarDayDropzone date={day} onUpdate={onUpdate} />
              </div>
            </PostCalendarDayContainer>
          );
        })}
      </div>
    </div>
  )
);

CalendarWeekRow.displayName = "CalendarWeekRow";
