import type { PostWithRelationsSchema } from "@fanslib/server/schemas";
import {
    add,
    eachDayOfInterval,
    endOfMonth,
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
import { Button } from "~/components/ui/Button";
import { usePostPreferences } from "~/contexts/PostPreferencesContext";
import { cn } from "~/lib/cn";
import { PostCalendarDayDropzone } from "./PostCalendarDayDropzone";
import { PostCalendarPost } from "./PostCalendarPost";

type Post = typeof PostWithRelationsSchema.static;

type PostCalendarProps = {
  className?: string;
  posts: Post[];
  onUpdate: () => Promise<void>;
};

export const PostCalendar = ({ className, posts, onUpdate }: PostCalendarProps) => {
  const { preferences, updatePreferences } = usePostPreferences();
  const [currentMonth, setCurrentMonth] = useState(() => format(new Date(preferences.filter.dateRange?.startDate ?? new Date()), "MMM-yyyy"));

  const firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date());

  const weekStart = startOfWeek(firstDayCurrentMonth, { locale: de });

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
    <div className={cn("w-full flex flex-col", className)}>
      <div className="flex items-center justify-between flex-none mb-6">
          <h2 className="text-2xl font-bold text-base-content">{format(firstDayCurrentMonth, "MMMM yyyy")}</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onPress={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onPress={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div
          className="grid grid-cols-7 text-sm gap-4"
        >
          {days.map((day, dayIdx) => {
            const dayPosts = posts.filter((post) => isSameDay(new Date(post.date), day));
            const isTodayDay = isToday(day);

            return (
              <div
                key={day.toString()}
                className={cn(
                  dayIdx === 0 && colStartClasses[getDayOffset(day)],
                  "flex flex-col min-h-[100px] rounded-lg p-2",
                  isTodayDay && "bg-base-200 ring-2 ring-primary/50"
                )}
              >
                {/* Day header */}
                <div className="text-center mb-2 flex-shrink-0">
                  <div className="text-xs text-base-content/60">{format(day, "EEE")}</div>
                  <time
                    dateTime={format(day, "yyyy-MM-dd")}
                    className={cn("text-sm font-medium", isTodayDay && "text-primary")}
                  >
                    {format(day, "d MMM")}
                  </time>
                </div>
                {dayPosts.length > 0 && (
                  <div className="flex-1 min-h-0 flex flex-col gap-2">
                    {dayPosts.map((post) => <PostCalendarPost
                          key={post.id}
                          onUpdate={onUpdate}
                          post={post}
                        />)}
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

