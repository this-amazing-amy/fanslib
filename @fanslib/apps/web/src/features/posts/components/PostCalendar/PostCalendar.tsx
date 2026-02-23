import type { PostWithRelations } from "@fanslib/server/schemas";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, ChevronDown, ChevronUp } from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useMemo } from "react";
import { Button } from "~/components/ui/Button";
import { usePrefersReducedMotion } from "~/hooks/usePrefersReducedMotion";
import { cn } from "~/lib/cn";
import { CalendarWeekRow } from "./CalendarWeekRow";
import { useTwoWeekCalendar } from "./useTwoWeekCalendar";

const slideVariants = {
  enter: (direction: number) => ({
    y: `${direction * 52}%`,
    opacity: 0,
  }),
  center: {
    y: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    y: `${direction * -52}%`,
    opacity: 0,
  }),
};

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
    const { weeks, visibleRange, pageDown, pageUp, jumpToToday, todayInView, direction, pageKey } =
      useTwoWeekCalendar();
    const prefersReducedMotion = usePrefersReducedMotion();

    useImperativeHandle(ref, () => ({ scrollToToday: jumpToToday }));

    useEffect(() => {
      onVisibleRangeChange?.(visibleRange.startDate, visibleRange.endDate);
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

    return (
      <div className={cn("relative h-full", className)}>
        {/* Paging buttons — floating outside the calendar on the left, anchored to top */}
        <div className="absolute -left-14 top-0 flex flex-col items-center gap-2 z-10">
          <Button
            variant="outline"
            size="icon"
            onPress={pageUp}
            aria-label="Previous week"
            className="rounded-full"
          >
            <ChevronUp className="w-5 h-5" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onPress={pageDown}
            aria-label="Next week"
            className="rounded-full"
          >
            <ChevronDown className="w-5 h-5" />
          </Button>

          {!todayInView && (
            <Button
              variant="outline"
              size="icon"
              onPress={jumpToToday}
              aria-label="Jump to today"
              className="rounded-full"
            >
              <CalendarDays className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Calendar grid — full width */}
        <div className="relative flex flex-col h-full min-h-0 overflow-hidden">
          <AnimatePresence initial={false} custom={direction.current} mode="popLayout">
            <motion.div
              key={pageKey}
              custom={direction.current}
              variants={prefersReducedMotion ? undefined : slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 400, damping: 40, mass: 0.8 }}
              className="absolute inset-0 flex flex-col gap-3"
            >
              <CalendarWeekRow
                week={weeks[0]}
                posts={visiblePosts}
                onUpdate={onUpdate}
              />
              <CalendarWeekRow
                week={weeks[1]}
                posts={visiblePosts}
                onUpdate={onUpdate}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }
);

PostCalendar.displayName = "PostCalendar";
