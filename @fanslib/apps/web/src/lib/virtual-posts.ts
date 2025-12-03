import type {
  ContentScheduleWithChannelSchema,
  MediaFilterSchema,
  PostSchema,
} from "@fanslib/server/schemas";
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

type Post = typeof PostSchema.static;
type ContentSchedule = typeof ContentScheduleWithChannelSchema.static;
type MediaFilters = typeof MediaFilterSchema.static;

const SCHEDULE_HORIZON_MONTHS = 1;

const DAY_NAME_TO_OFFSET: Record<string, number> = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 0,
};

export type VirtualPostSchedule = {
  id: string;
  name: string;
  emoji: string | null;
  color: string | null;
};

export type VirtualPost = Omit<Post, "id" | "createdAt" | "updatedAt" | "postMedia"> & {
  isVirtual: true;
  scheduleId: string;
  virtualId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fanslyAnalyticsDatapoints: any[];
  fanslyStatisticsId: string | null;
  url: string | null;
  subreddit: string | null;
  subredditId: string | null;
  mediaFilters: MediaFilters | null;
  schedule: VirtualPostSchedule;

  fanslyAnalyticsAggregate: undefined;
  channel: ContentSchedule["channel"];
};

export const isVirtualPost = (post: Post | VirtualPost): post is VirtualPost => "isVirtual" in post && post.isVirtual === true;

const parseMediaFilters = (mediaFilters?: string | null): MediaFilters | null => {
  if (!mediaFilters) return null;
  try {
    return JSON.parse(mediaFilters);
  } catch {
    return null;
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const generateScheduleDates = (schedule: ContentSchedule & { channel: any }, startDate: Date = new Date()): Date[] => {
  const endDate = addMonths(startDate, SCHEDULE_HORIZON_MONTHS);

  switch (schedule.type) {
    case "daily": {
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      const postsPerDay = schedule.postsPerTimeframe ?? 1;

      const dates = days.flatMap((day) => Array.from({ length: postsPerDay }).map((_, j) => {
          const date = new Date(day);
          const time = schedule.preferredTimes?.at(j % (schedule.preferredTimes?.length ?? 1));
          date.setHours(Number(time?.split(":")[0]) || 12);
          date.setMinutes(Number(time?.split(":")[1]) || 0);
          return date;
        }));

      return dates;
    }

    case "weekly": {
      const weeks = eachWeekOfInterval({ start: startDate, end: endDate });
      const postsPerWeek = schedule.postsPerTimeframe ?? 1;

      const dates = weeks.flatMap((week) => Array.from({ length: postsPerWeek }).map((_, i) => {
          const dayName = schedule.preferredDays?.at(i % (schedule.preferredDays?.length ?? 1)) ?? "Monday";
          const dayOffset = DAY_NAME_TO_OFFSET[dayName] ?? 1;
          const date = addDays(startOfWeek(week), dayOffset);
          const time = schedule.preferredTimes?.at(i % (schedule.preferredTimes?.length ?? 1));
          date.setHours(Number(time?.split(":")[0]) || 12);
          date.setMinutes(Number(time?.split(":")[1]) || 0);
          return date;
        }));

      return dates;
    }

    case "monthly": {
      const months = eachMonthOfInterval({ start: startDate, end: endDate });
      const preferredDays = schedule.preferredDays?.length ? schedule.preferredDays : ["Sunday"];
      const dates: Date[] = [];

      months.forEach((month) => {
        const monthDates: Date[] = [];

        preferredDays.forEach((weekdayName: string) => {
          const dayOffset = DAY_NAME_TO_OFFSET[weekdayName];
          if (dayOffset === undefined) {
            return;
          }

          // Find all occurrences of this weekday in the month
          const monthStart = startOfMonth(month);
          const monthEnd = endOfMonth(month);
          const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd });

          weeks.forEach((week) => {
            const date = addDays(startOfWeek(week), dayOffset);
            if (date >= monthStart && date <= monthEnd && date <= endDate) {
              monthDates.push(date);
            }
          });
        });

        // Sort and take postsPerMonth from this month
        monthDates.sort((a, b) => a.getTime() - b.getTime());
        const postsPerMonth = schedule.postsPerTimeframe ?? 1;
        const selectedDates = monthDates.slice(0, postsPerMonth);

        selectedDates.forEach((date) => {
          const time = schedule.preferredTimes?.at(0);
          date.setHours(Number(time?.split(":")[0]) || 12);
          date.setMinutes(Number(time?.split(":")[1]) || 0);
          dates.push(date);
        });
      });

      return dates;
    }

    default:
      return [];
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const generateVirtualPosts = (schedules: (ContentSchedule & { channel: any })[], existingPosts: Post[] = [], currentTime: Date = new Date()): VirtualPost[] => schedules.flatMap((schedule) => {
    const dates = generateScheduleDates(schedule, currentTime);

    const filteredDates = dates.filter((date) => !existingPosts.some((post) => {
        const postDate = new Date(post.date);
        return isSameMinute(postDate, date) && schedule.channelId === post.channelId;
      }));

    const mediaFilters = parseMediaFilters(schedule.mediaFilters);

    return filteredDates.map((scheduleDate, index) => ({
      isVirtual: true as const,
      virtualId: `${schedule.id}-${index}`,
      scheduleId: schedule.id,
      schedule: {
        id: schedule.id,
        name: schedule.name,
        emoji: schedule.emoji,
        color: schedule.color,
      },
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

