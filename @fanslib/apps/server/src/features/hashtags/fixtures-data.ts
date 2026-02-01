import type { Hashtag, HashtagChannelStats } from "./entity";

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
