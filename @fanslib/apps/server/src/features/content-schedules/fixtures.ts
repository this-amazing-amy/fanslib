import type { DataSource } from "typeorm";
import type { Channel } from "../channels/entity";
import { ContentSchedule as ContentScheduleEntity, ScheduleChannel } from "./entity";
import { CONTENT_SCHEDULE_FIXTURES } from "./fixtures-data";

export { CONTENT_SCHEDULE_FIXTURES } from "./fixtures-data";

export const seedContentScheduleFixtures = async (dataSource: DataSource, channels: Channel[]) => {
  const scheduleRepo = dataSource.getRepository(ContentScheduleEntity);
  const scheduleChannelRepo = dataSource.getRepository(ScheduleChannel);
  const now = new Date().toISOString();

  // eslint-disable-next-line functional/no-loop-statements
  for (const fixture of CONTENT_SCHEDULE_FIXTURES) {
    const channel = channels.find((c) => c.id === fixture.fixtureChannelId);
    if (!channel) {
      continue;
    }

    const existing = await scheduleRepo.findOne({ where: { id: fixture.id } });
    if (!existing) {
      const schedule = scheduleRepo.create({
        id: fixture.id,
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

      // Create ScheduleChannel link
      const existingSC = await scheduleChannelRepo.findOne({
        where: { scheduleId: fixture.id, channelId: channel.id },
      });
      if (!existingSC) {
        const sc = scheduleChannelRepo.create({
          scheduleId: fixture.id,
          channelId: channel.id,
          mediaFilterOverrides: null,
          sortOrder: 0,
        });
        await scheduleChannelRepo.save(sc);
      }
    }
  }

  return await scheduleRepo.find({
    relations: { scheduleChannels: { channel: true } },
  });
};
