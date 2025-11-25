import { getTestDataSource } from "../../lib/db.test";
import type { Channel } from "../channels/entity";
import type { ContentSchedule } from "./entity";
import { ContentSchedule as ContentScheduleEntity } from "./entity";

export type ContentScheduleFixture = Omit<ContentSchedule, "createdAt" | "updatedAt" | "mediaFilters" | "channel">;

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
  },
];

export const seedContentScheduleFixtures = async (channels: Channel[]) => {
  const dataSource = getTestDataSource();
  const scheduleRepo = dataSource.getRepository(ContentScheduleEntity);
  const now = new Date().toISOString();

  // eslint-disable-next-line functional/no-loop-statements
  for (const fixture of CONTENT_SCHEDULE_FIXTURES) {
    const channel = channels.find((c) => c.id === fixture.channelId);
    if (!channel) {
      continue;
    }

    const existing = await scheduleRepo.findOne({ where: { id: fixture.id } });
    if (!existing) {
      const schedule = scheduleRepo.create({
        id: fixture.id,
        channelId: fixture.channelId,
        channel,
        name: fixture.name,
        emoji: fixture.emoji,
        color: fixture.color,
        type: fixture.type,
        postsPerTimeframe: fixture.postsPerTimeframe,
        preferredDays: fixture.preferredDays,
        preferredTimes: fixture.preferredTimes,
        createdAt: now,
        updatedAt: now,
      });
      await scheduleRepo.save(schedule);
    }
  }

  return await scheduleRepo.find({
    relations: { channel: true },
  });
};

