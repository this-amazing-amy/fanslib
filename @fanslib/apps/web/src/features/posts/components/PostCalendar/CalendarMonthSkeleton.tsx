import {
    eachDayOfInterval,
    endOfMonth,
    format,
    getDay,
    startOfMonth,
    startOfWeek,
} from "date-fns";
import { de } from "date-fns/locale";
import { Skeleton } from "~/components/ui/Skeleton/Skeleton";
import { cn } from "~/lib/cn";

type CalendarMonthSkeletonProps = {
  monthDate: Date;
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

export const CalendarMonthSkeleton = ({ monthDate }: CalendarMonthSkeletonProps) => {
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

  return (
    <div className="w-full">
      {/* Month header */}
      <h2 className="text-2xl font-bold text-base-content mb-4">
        {format(firstDayOfMonth, "MMMM yyyy")}
      </h2>

      {/* Days grid */}
      <div className="grid grid-cols-7 text-sm gap-4">
        {days.map((day, dayIdx) => (
          <div
            key={day.toString()}
            className={cn(
              dayIdx === 0 && colStartClasses[getDayOffset(day)],
              "flex flex-col min-h-[100px] rounded-lg p-2"
            )}
          >
            {/* Day header */}
            <div className="flex items-center gap-1.5 mb-2 flex-shrink-0">
              <Skeleton variant="circular" width={24} height={24} />
              <Skeleton variant="text" width={24} height={16} />
            </div>
            {/* Skeleton post */}
            <div className="flex-1 min-h-0">
              <Skeleton className="w-full aspect-square rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
