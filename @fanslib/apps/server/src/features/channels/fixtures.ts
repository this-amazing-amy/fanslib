import { getTestDataSource } from "../../lib/test-db";
import { CHANNEL_TYPES } from "./channelTypes";
import { Channel as ChannelEntity, ChannelType as ChannelTypeEntity } from "./entity";
import { CHANNEL_FIXTURES } from "./fixtures-data";

export { CHANNEL_FIXTURES } from "./fixtures-data";

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

