import { getTestDataSource } from "../../lib/db.test";
import type { Channel } from "../channels/entity";
import { HashtagChannelStats as HashtagChannelStatsEntity, Hashtag as HashtagEntity } from "./entity";
import { normalizeHashtagName } from "./operations/hashtag/helpers";

type Hashtag = HashtagEntity;
type HashtagChannelStats = HashtagChannelStatsEntity;

export type HashtagFixture = Pick<Hashtag, "name">;

export const HASHTAG_FIXTURES: HashtagFixture[] = [
  { name: "nsfw" },
  { name: "gaming" },
  { name: "art" },
  { name: "cosplay" },
  { name: "fitness" },
];

export type HashtagChannelStatsFixture = Pick<HashtagChannelStats, "views"> & {
  hashtagName: string;
  channelId: string;
};

export const HASHTAG_CHANNEL_STATS_FIXTURES: HashtagChannelStatsFixture[] = [
  { hashtagName: "nsfw", channelId: "channel-1", views: 100 },
  { hashtagName: "gaming", channelId: "channel-1", views: 50 },
  { hashtagName: "art", channelId: "channel-2", views: 75 },
];

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

