import type { PostWithRelations } from "@fanslib/server/schemas";
import { format, isSameDay, isToday } from "date-fns";
import { memo } from "react";
import { cn } from "~/lib/cn";
import { PostCalendarDayContainer } from "./PostCalendarDayContainer";
import { PostCalendarDayDropzone } from "./PostCalendarDayDropzone";
import { PostCalendarPost } from "./PostCalendarPost";

type Post = PostWithRelations;

type CalendarDayColumnProps = {
  day: Date;
  posts: Post[];
  allPosts: Post[];
  onUpdate: () => Promise<void>;
  style?: React.CSSProperties;
};

export const CalendarDayColumn = memo(
  ({ day, posts, allPosts, onUpdate, style }: CalendarDayColumnProps) => {
    const dayPosts = posts.filter((post) => isSameDay(new Date(post.date), day));
    const today = isToday(day);

    return (
      <div
        className="flex-shrink-0 h-full pt-0.5"
        style={{ scrollSnapAlign: style?.scrollSnapAlign ?? "start", ...style }}
      >
        <PostCalendarDayContainer
          date={day}
          onUpdate={onUpdate}
          className={cn(
            "flex flex-col rounded-lg p-1.5 h-full min-h-0",
            today && "bg-base-200 ring-2 ring-primary",
          )}
        >
          <div className="flex items-center gap-1 mb-1 flex-shrink-0">
            <time
              dateTime={format(day, "yyyy-MM-dd")}
              className={cn(
                "font-medium text-xs w-5 h-5 flex items-center justify-center",
                today && "bg-primary text-primary-content rounded-full",
              )}
            >
              {format(day, "d")}
            </time>
            <span className="text-[10px] text-base-content/50">{format(day, "EEE")}</span>
          </div>

          <div className="flex flex-col gap-1.5 overflow-y-auto overflow-x-hidden scrollbar-thin flex-1 min-h-0">
            {dayPosts.map((post) => (
              <PostCalendarPost key={post.id} post={post} onUpdate={onUpdate} allPosts={allPosts} />
            ))}
            <PostCalendarDayDropzone date={day} onUpdate={onUpdate} />
          </div>
        </PostCalendarDayContainer>
      </div>
    );
  },
);

CalendarDayColumn.displayName = "CalendarDayColumn";
