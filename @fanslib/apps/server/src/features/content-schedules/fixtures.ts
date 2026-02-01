import { getTestDataSource } from "../../lib/test-db";
import type { Channel } from "../channels/entity";
import { ContentSchedule as ContentScheduleEntity } from "./entity";
import { CONTENT_SCHEDULE_FIXTURES } from "./fixtures-data";

export { CONTENT_SCHEDULE_FIXTURES } from "./fixtures-data";

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

