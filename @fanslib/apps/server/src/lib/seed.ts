import { db } from "./db";
import { ChannelType } from "../features/channels/entity";
import { CHANNEL_TYPES } from "../features/channels/channelTypes";
import { ContentSchedule, ScheduleChannel } from "../features/content-schedules/entity";

export const seedChannelTypes = async () => {
  const dataSource = await db();
  const repository = dataSource.getRepository(ChannelType);

  const existingCount = await repository.count();
  if (existingCount > 0) {
    console.log(`✓ Channel types already seeded (${existingCount} types)`);
    return;
  }

  const channelTypes = Object.values(CHANNEL_TYPES).map((type) =>
    repository.create({
      id: type.id,
      name: type.name,
      color: type.color,
    })
  );

  await repository.save(channelTypes);
  console.log(`✓ Seeded ${channelTypes.length} channel types`);
};

export const migrateSchedulesToMultiChannel = async () => {
  const dataSource = await db();
  const scheduleRepo = dataSource.getRepository(ContentSchedule);
  const scheduleChannelRepo = dataSource.getRepository(ScheduleChannel);

  const schedulesWithLegacyChannel = await scheduleRepo.find({
    where: {},
  });

  const schedulesNeedingMigration = schedulesWithLegacyChannel.filter(
    (s) => s.channelId !== null
  );

  if (schedulesNeedingMigration.length === 0) {
    console.log("✓ No schedules need migration to multi-channel model");
    return { migrated: 0 };
  }

  const results = await Promise.all(
    schedulesNeedingMigration.map(async (schedule) => {
      const channelId = schedule.channelId;
      if (!channelId) {
        return { scheduleId: schedule.id, migrated: false, reason: "no_channel_id" };
      }

      const existingScheduleChannel = await scheduleChannelRepo.findOne({
        where: { scheduleId: schedule.id, channelId },
      });

      if (existingScheduleChannel) {
        return { scheduleId: schedule.id, migrated: false, reason: "already_exists" };
      }

      const scheduleChannel = scheduleChannelRepo.create({
        scheduleId: schedule.id,
        channelId,
        mediaFilterOverrides: null,
        sortOrder: 0,
      });
      await scheduleChannelRepo.save(scheduleChannel);

      return { scheduleId: schedule.id, migrated: true };
    })
  );

  const migratedCount = results.filter((r) => r.migrated).length;
  console.log(`✓ Migrated ${migratedCount} schedules to multi-channel model`);

  return { migrated: migratedCount };
};

export const seedDatabase = async () => {
  console.log("🌱 Seeding database...");
  await seedChannelTypes();
  await migrateSchedulesToMultiChannel();
  console.log("✅ Database seeding complete");
};
