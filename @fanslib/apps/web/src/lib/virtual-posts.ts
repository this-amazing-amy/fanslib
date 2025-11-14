import {
  addDays,
  addMonths,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  endOfMonth,
  format,
  isSameMinute,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { ContentSchedule } from "@fanslib/types";
import type { MediaFilters } from "@fanslib/types";
import type { Post } from "@fanslib/types";

const SCHEDULE_HORIZON_MONTHS = 3;

export type VirtualPost = Omit<Post, "id" | "createdAt" | "updatedAt" | "postMedia"> & {
  isVirtual: true;
  scheduleId: string;
  virtualId: string;
  fanslyAnalyticsDatapoints: any[];
  fanslyStatisticsId: string | null;
  url: string | null;
  subreddit: string | null;
  subredditId: string | null;
  mediaFilters: MediaFilters | null;
  fanslyAnalyticsAggregate: undefined;
  channel: ContentSchedule["channel"];
};

export const isVirtualPost = (post: Post | VirtualPost): post is VirtualPost => {
  return "isVirtual" in post && post.isVirtual === true;
};

const parseMediaFilters = (mediaFilters?: string | null): MediaFilters | null => {
  if (!mediaFilters) return null;
  try {
    return JSON.parse(mediaFilters);
  } catch {
    return null;
  }
};

const generateScheduleDates = (schedule: ContentSchedule & { channel: any }, startDate: Date = new Date()): Date[] => {
  const endDate = addMonths(startDate, SCHEDULE_HORIZON_MONTHS);

  switch (schedule.type) {
    case "daily": {
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      const postsPerDay = schedule.postsPerTimeframe || 1;

      const dates = days.flatMap((day) => {
        return Array.from({ length: postsPerDay }).map((_, j) => {
          const date = new Date(day);
          const time = schedule.preferredTimes?.at(j % (schedule.preferredTimes?.length || 1));
          date.setHours(Number(time?.split(":")[0]) || 12);
          date.setMinutes(Number(time?.split(":")[1]) || 0);
          return date;
        });
      });

      return dates;
    }

    case "weekly": {
      const weeks = eachWeekOfInterval({ start: startDate, end: endDate });
      const postsPerWeek = schedule.postsPerTimeframe || 1;

      const dates = weeks.flatMap((week) => {
        return Array.from({ length: postsPerWeek }).map((_, i) => {
          const date = addDays(
            startOfWeek(week),
            parseInt(schedule.preferredDays?.at(i % (schedule.preferredDays?.length || 1)) || "0")
          );
          const time = schedule.preferredTimes?.at(i % (schedule.preferredTimes?.length || 1));
          date.setHours(Number(time?.split(":")[0]) || 12);
          date.setMinutes(Number(time?.split(":")[1]) || 0);
          return date;
        });
      });

      return dates;
    }

    case "monthly": {
      const months = eachMonthOfInterval({ start: startDate, end: endDate });
      const preferredDays = schedule.preferredDays?.length ? schedule.preferredDays : ["1"];
      const dates: Date[] = [];

      months.forEach((month) => {
        preferredDays.forEach((day) => {
          const date = addDays(startOfMonth(month), parseInt(day) - 1);
          if (date <= endOfMonth(month) && date <= endDate) {
            dates.push(date);
          }
        });
      });

      const postsPerMonth = schedule.postsPerTimeframe || preferredDays.length;
      return dates.slice(0, postsPerMonth * months.length);
    }

    default:
      return [];
  }
};

export const generateVirtualPosts = (
  schedules: (ContentSchedule & { channel: any })[],
  existingPosts: Post[] = [],
  currentTime: Date = new Date()
): VirtualPost[] => {
  return schedules.flatMap((schedule) => {
    const dates = generateScheduleDates(schedule, currentTime);

    const filteredDates = dates.filter((date) => {
      return !existingPosts.some((post) => {
        const postDate = new Date(post.date);
        return isSameMinute(postDate, date) && schedule.channelId === post.channelId;
      });
    });

    const mediaFilters = parseMediaFilters(schedule.mediaFilters);

    return filteredDates.map((scheduleDate, index) => ({
      isVirtual: true as const,
      virtualId: `${schedule.id}-${index}`,
      scheduleId: schedule.id,
      channel: schedule.channel,
      channelId: schedule.channelId,
      caption: "",
      date: format(scheduleDate, "yyyy-MM-dd'T'HH:mm:ssXXX"),
      status: "draft" as const,
      url: null,
      fanslyStatisticsId: null,
      subreddit: null,
      subredditId: null,
      mediaFilters,
      fanslyAnalyticsAggregate: undefined,
      fanslyAnalyticsDatapoints: [],
      fypRemovedAt: null,
    }));
  });
};

