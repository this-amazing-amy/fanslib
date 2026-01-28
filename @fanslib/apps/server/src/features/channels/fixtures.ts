import { getTestDataSource } from "../../lib/db.test";
import { CHANNEL_TYPES } from "./channelTypes";
import type { Channel } from "./entity";
import { Channel as ChannelEntity, ChannelType as ChannelTypeEntity } from "./entity";

export type ChannelFixture = Omit<Channel, "eligibleMediaFilter" | "type">;

export const CHANNEL_FIXTURES: ChannelFixture[] = [
  {
    id: "channel-1",
    name: "My Fansly Channel",
    typeId: "fansly",
    description: "Main Fansly channel for content",
    defaultHashtags: [],
  },
  {
    id: "channel-2",
    name: "OnlyFans Account",
    typeId: "onlyfans",
    description: "Primary OnlyFans channel",
    defaultHashtags: [],
  },
  {
    id: "channel-3",
    name: "Reddit Promo",
    typeId: "reddit",
    description: "Reddit promotion channel",
    defaultHashtags: [],
  },
];

export const seedChannelFixtures = async () => {
  const dataSource = getTestDataSource();
  const channelTypeRepo = dataSource.getRepository(ChannelTypeEntity);
  const channelRepo = dataSource.getRepository(ChannelEntity);

  await Promise.all(
    Object.values(CHANNEL_TYPES).map(async (type) => {
      const existing = await channelTypeRepo.findOne({ where: { id: type.id } });
      if (!existing) {
        await channelTypeRepo.save({
          id: type.id,
          name: type.name,
          color: type.color,
        });
      }
    })
  );

  await Promise.all(
    CHANNEL_FIXTURES.map(async (fixture) => {
      const existing = await channelRepo.findOne({ where: { id: fixture.id } });
      if (!existing) {
        await channelRepo.insert({
          id: fixture.id,
          name: fixture.name,
          typeId: fixture.typeId,
          description: fixture.description,
        });
      }
    })
  );

  return {
    channelTypes: await channelTypeRepo.find(),
    channels: await channelRepo.find({
      relations: { type: true, defaultHashtags: true },
    }),
  };
};

