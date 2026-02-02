import type { Channel } from "./entity";

export type ChannelFixture = Omit<Channel, "eligibleMediaFilter" | "type">;

export const CHANNEL_FIXTURES: ChannelFixture[] = [
  {
    id: "channel-1",
    name: "My Fansly Channel",
    typeId: "fansly",
    description: "Main Fansly channel for content",
    postCooldownHours: null,
    mediaRepostCooldownHours: null,
    defaultHashtags: [],
  },
  {
    id: "channel-2",
    name: "OnlyFans Account",
    typeId: "onlyfans",
    description: "Primary OnlyFans channel",
    postCooldownHours: null,
    mediaRepostCooldownHours: null,
    defaultHashtags: [],
  },
  {
    id: "channel-3",
    name: "Reddit Promo",
    typeId: "reddit",
    description: "Reddit promotion channel",
    postCooldownHours: null,
    mediaRepostCooldownHours: null,
    defaultHashtags: [],
  },
];
