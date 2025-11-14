import {
  add,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isSameDay,
  isToday,
  parse,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { de } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import type { Post } from "@fanslib/types";
import { Button } from "~/components/ui/Button";
import { usePlanPreferences } from "~/contexts/PlanPreferencesContext";
import { cn } from "~/lib/cn";
import { isVirtualPost, type VirtualPost } from "~/lib/virtual-posts";
import { PostCalendarDayDropzone } from "./PostCalendarDayDropzone";
import { PostCalendarPost } from "./PostCalendarPost";

type PostCalendarProps = {
  className?: string;
  posts: (Post | VirtualPost)[];
  onUpdate: () => Promise<void>;
  scrollRef?: React.RefObject<HTMLDivElement>;
};

export const PostCalendar = ({ className, posts, onUpdate, scrollRef }: PostCalendarProps) => {
  const { preferences, updatePreferences } = usePlanPreferences();
  const [currentMonth, setCurrentMonth] = useState(() => {
    return format(new Date(preferences.filter.dateRange?.startDate || new Date()), "MMM-yyyy");
  });

  const firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date());

  const weekStart = startOfWeek(firstDayCurrentMonth, { locale: de });
  const weekEnd = endOfWeek(firstDayCurrentMonth, { locale: de });

  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd }).map((day) =>
    format(day, "EEEEE", { locale: de })
  );

  const days = eachDayOfInterval({
    start: startOfMonth(firstDayCurrentMonth),
    end: endOfMonth(firstDayCurrentMonth),
  });

  const previousMonth = () => {
    const firstDayPreviousMonth = add(firstDayCurrentMonth, { months: -1 });
    const lastDayPreviousMonth = endOfMonth(firstDayPreviousMonth);

    setCurrentMonth(format(firstDayPreviousMonth, "MMM-yyyy"));
    updatePreferences({
      filter: {
        dateRange: {
          startDate: startOfMonth(firstDayPreviousMonth).toISOString(),
          endDate: lastDayPreviousMonth.toISOString(),
        },
      },
    });
  };

  const nextMonth = () => {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 });
    const lastDayNextMonth = endOfMonth(firstDayNextMonth);

    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"));
    updatePreferences({
      filter: {
        dateRange: {
          startDate: startOfMonth(firstDayNextMonth).toISOString(),
          endDate: lastDayNextMonth.toISOString(),
        },
      },
    });
  };

  useEffect(() => {
    if (preferences.filter.dateRange?.startDate) {
      const newMonth = format(new Date(preferences.filter.dateRange.startDate), "MMM-yyyy");
      if (newMonth !== currentMonth) {
        setCurrentMonth(newMonth);
      }
    }
  }, [preferences.filter.dateRange?.startDate, currentMonth]);

  const getDayOffset = (date: Date) => {
    const firstDayOffset = getDay(weekStart);
    const currentDayOffset = getDay(date);
    return (currentDayOffset - firstDayOffset + 7) % 7;
  };

  return (
    <div className={cn("w-full h-full flex flex-col", className)}>
      <div className="flex items-center justify-between flex-none">
        <h2 className="font-semibold">{format(firstDayCurrentMonth, "MMMM yyyy")}</h2>
        <div className="space-x-2">
          <Button variant="outline" size="icon" onPress={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onPress={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 mt-6 text-xs leading-6 text-center text-base-content/60 flex-none">
        {weekDays.map((day, i) => (
          <div key={i}>{day}</div>
        ))}
      </div>
      <div
        className="grid grid-cols-7 mt-2 text-sm flex-1 min-h-0 overflow-auto gap-y-8 gap-x-2"
        ref={scrollRef}
      >
        {days.map((day, dayIdx) => {
          const dayPosts = posts.filter((post) => isSameDay(new Date(post.date), day));

          return (
            <div
              key={day.toString()}
              className={cn(
                dayIdx === 0 && colStartClasses[getDayOffset(day)],
                "py-2 px-1 flex flex-col"
              )}
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full flex-none text-xl font-bold",
                    isToday(day) && "text-base-100 bg-primary"
                  )}
                >
                  <time dateTime={format(day, "yyyy-MM-dd")}>{format(day, "d")}</time>
                </button>
                <span className="text-xs text-base-content/60">{format(day, "EEEE")}</span>
              </div>
              {dayPosts.length > 0 && (
                <div className="flex-1 mt-1 min-h-0 flex flex-col gap-2">
                  {dayPosts.map((post) => {
                    return (
                      <PostCalendarPost
                        key={isVirtualPost(post) ? post.virtualId : post.id}
                        onUpdate={onUpdate}
                        post={post}
                      />
                    );
                  })}
                </div>
              )}
              <PostCalendarDayDropzone date={day} onUpdate={onUpdate} />
            </div>
          );
        })}
      </div>
    </div>
  );
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

