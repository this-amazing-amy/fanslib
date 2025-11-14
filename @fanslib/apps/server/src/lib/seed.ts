import { db } from "./db";
import { ChannelType } from "../features/channels/entity";
import { CHANNEL_TYPES } from "../features/channels/channelTypes";

export const seedChannelTypes = async () => {
  const dataSource = await db();
  const repository = dataSource.getRepository(ChannelType);

  // Check if channel types already exist
  const existingCount = await repository.count();
  if (existingCount > 0) {
    console.log(`✓ Channel types already seeded (${existingCount} types)`);
    return;
  }

  // Insert all channel types
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

export const seedDatabase = async () => {
  console.log("🌱 Seeding database...");
  await seedChannelTypes();
  console.log("✅ Database seeding complete");
};
