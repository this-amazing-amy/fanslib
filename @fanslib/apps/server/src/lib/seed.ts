import { db } from "./db";
import { Channel, ChannelType } from "../features/channels/entity";
import { CHANNEL_TYPES } from "../features/channels/channelTypes";
import { ContentSchedule, ScheduleChannel } from "../features/content-schedules/entity";
import { Subreddit } from "../features/subreddits/entity";

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

export const migrateSubredditsToChannelComposition = async () => {
  const dataSource = await db();
  const subredditRepo = dataSource.getRepository(Subreddit);
  const channelRepo = dataSource.getRepository(Channel);

  const subredditsWithoutChannel = await subredditRepo.find({
    where: {},
    relations: ["channel"],
  });

  const subredditsNeedingMigration = subredditsWithoutChannel.filter(
    (s) => s.channelId === null
  );

  if (subredditsNeedingMigration.length === 0) {
    console.log("✓ No subreddits need migration to channel composition");
    return { migrated: 0 };
  }

  console.log(`🔄 Migrating ${subredditsNeedingMigration.length} subreddits to channel composition...`);

  const results = await Promise.all(
    subredditsNeedingMigration.map(async (subreddit) => {
      try {
        // Read old data from database columns that may still exist
        const rawSubreddit = await dataSource.query(
          `SELECT name, eligibleMediaFilter FROM subreddit WHERE id = ?`,
          [subreddit.id]
        ).catch(() => null);

        const oldName = rawSubreddit?.[0]?.name;
        const oldEligibleMediaFilter = rawSubreddit?.[0]?.eligibleMediaFilter;

        // Use old data if available, otherwise generate default name
        const channelName = oldName ?? `r/subreddit-${subreddit.id.slice(0, 8)}`;
        
        const existingChannel = await channelRepo.findOne({
          where: { name: channelName, typeId: "reddit" },
        });

        const channel = existingChannel ?? channelRepo.create({
          name: channelName,
          typeId: "reddit",
          description: subreddit.notes,
          eligibleMediaFilter: oldEligibleMediaFilter ? JSON.parse(oldEligibleMediaFilter) : null,
          postCooldownHours: subreddit.maxPostFrequencyHours,
          mediaRepostCooldownHours: 720,
        });

        if (existingChannel) {
          console.log(`  → Found existing channel "${channel.name}" for subreddit ${subreddit.id}`);
        } else {
          await channelRepo.save(channel);
          console.log(`  → Created new channel "${channel.name}" for subreddit ${subreddit.id}`);
        }

        subreddit.channelId = channel.id;
        await subredditRepo.save(subreddit);

        return { subredditId: subreddit.id, migrated: true };
      } catch (error) {
        console.error(`  ✗ Failed to migrate subreddit ${subreddit.id}:`, error);
        return { subredditId: subreddit.id, migrated: false, error };
      }
    })
  );

  const migratedCount = results.filter((r) => r.migrated).length;
  console.log(`✓ Migrated ${migratedCount} subreddits to channel composition`);

  return { migrated: migratedCount, failed: results.length - migratedCount };
};

export const seedDatabase = async () => {
  console.log("🌱 Seeding database...");
  await seedChannelTypes();
  await migrateSchedulesToMultiChannel();
  await migrateSubredditsToChannelComposition();
  console.log("✅ Database seeding complete");
};
