import type { ContentSchedule } from "./entity";

export type ContentScheduleFixture = Omit<ContentSchedule, "createdAt" | "updatedAt" | "mediaFilters" | "channel" | "scheduleChannels">;

export const CONTENT_SCHEDULE_FIXTURES: ContentScheduleFixture[] = [
  {
    id: "schedule-1",
    channelId: "channel-1",
    name: "Daily Posts",
    emoji: "📅",
    color: "#6366f1",
    type: "daily",
    postsPerTimeframe: 2,
    preferredDays: null,
    skippedSlots: [],
    preferredTimes: ["09:00", "18:00"],
  },
  {
    id: "schedule-2",
    channelId: "channel-2",
    name: "Weekly Content",
    emoji: "📆",
    color: "#22c55e",
    type: "weekly",
    postsPerTimeframe: 5,
    preferredDays: ["Monday", "Wednesday", "Friday"],
    preferredTimes: ["10:00", "15:00"],
    skippedSlots: [],
  },
];
