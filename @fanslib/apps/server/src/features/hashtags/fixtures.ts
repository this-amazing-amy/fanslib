import { getTestDataSource } from "../../lib/test-db";
import type { Channel } from "../channels/entity";
import { Hashtag as HashtagEntity, HashtagChannelStats as HashtagChannelStatsEntity } from "./entity";
import { normalizeHashtagName } from "./operations/hashtag/helpers";
import { HASHTAG_FIXTURES, HASHTAG_CHANNEL_STATS_FIXTURES } from "./fixtures-data";

export { HASHTAG_FIXTURES, HASHTAG_CHANNEL_STATS_FIXTURES } from "./fixtures-data";

export const seedHashtagFixtures = async (channels: Channel[]) => {
  const dataSource = getTestDataSource();
  const hashtagRepo = dataSource.getRepository(HashtagEntity);
  const statsRepo = dataSource.getRepository(HashtagChannelStatsEntity);

  const createdHashtags = await Promise.all(
    HASHTAG_FIXTURES.map(async (fixture) => {
      const normalizedName = normalizeHashtagName(fixture.name);
      const existing = await hashtagRepo.findOne({ where: { name: normalizedName } });
      if (existing) {
        return existing;
      }
      const hashtag = hashtagRepo.create({ name: normalizedName });
      return hashtagRepo.save(hashtag);
    })
  );

  await Promise.all(
    HASHTAG_CHANNEL_STATS_FIXTURES.map(async (fixture) => {
      const normalizedHashtagName = normalizeHashtagName(fixture.hashtagName);
      const hashtag = createdHashtags.find((h) => h.name === normalizedHashtagName);
      const channel = channels.find((c) => c.id === fixture.channelId);

      if (!hashtag || !channel) {
        return;
      }

      const existing = await statsRepo.findOne({
        where: { hashtagId: hashtag.id, channelId: channel.id },
      });

      if (!existing) {
        const stats = statsRepo.create({
          hashtagId: hashtag.id,
          channelId: channel.id,
          views: fixture.views,
        });
        await statsRepo.save(stats);
      }
    })
  );

  return {
    hashtags: await hashtagRepo.find(),
    hashtagChannelStats: await statsRepo.find({
      relations: { hashtag: true, channel: true },
    }),
  };
};

