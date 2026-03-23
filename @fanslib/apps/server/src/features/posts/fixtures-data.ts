import type { Post, PostMedia } from "./entity";

export type PostFixture = Pick<
  Post,
  "id" | "channelId" | "subredditId" | "caption" | "status" | "date"
>;

export const POST_FIXTURES: PostFixture[] = [
  {
    id: "post-1",
    channelId: "channel-1",
    caption: "Check out this amazing content!",
    status: "draft",
    date: new Date("2024-01-15"),
    subredditId: null,
  },
  {
    id: "post-2",
    channelId: "channel-1",
    subredditId: "subreddit-1",
    caption: "New post here!",
    status: "scheduled",
    date: new Date("2024-01-16"),
  },
  {
    id: "post-3",
    channelId: "channel-2",
    caption: "Posted content",
    status: "posted",
    date: new Date("2024-01-17"),
    subredditId: null,
  },
  {
    id: "post-fansly-fyp-demo",
    channelId: "channel-1",
    caption: "Fixture: still growing on FYP",
    status: "posted",
    date: new Date("2025-01-20"),
    subredditId: null,
  },
  {
    id: "post-fansly-repost-a",
    channelId: "channel-1",
    caption: "Fixture: first post of repostable media",
    status: "posted",
    date: new Date("2024-06-01"),
    subredditId: null,
  },
  {
    id: "post-fansly-repost-b",
    channelId: "channel-1",
    caption: "Fixture: second post of repostable media",
    status: "posted",
    date: new Date("2025-02-01"),
    subredditId: null,
  },
];

export type PostMediaFixture = Pick<PostMedia, "order" | "isFreePreview"> & {
  postId: string;
  mediaId: string;
  fanslyStatisticsId?: string | null;
};

export const POST_MEDIA_FIXTURES: PostMediaFixture[] = [
  { postId: "post-1", mediaId: "media-1", order: 0, isFreePreview: true },
  { postId: "post-1", mediaId: "media-2", order: 1, isFreePreview: false },
  { postId: "post-2", mediaId: "media-3", order: 0, isFreePreview: true },
  { postId: "post-3", mediaId: "media-4", order: 0, isFreePreview: false },
  {
    postId: "post-fansly-fyp-demo",
    mediaId: "media-1",
    order: 0,
    isFreePreview: false,
    fanslyStatisticsId: "fixture-fyp-active-stats",
  },
  {
    postId: "post-fansly-repost-a",
    mediaId: "media-5",
    order: 0,
    isFreePreview: false,
    fanslyStatisticsId: "fixture-repost-stats-a",
  },
  {
    postId: "post-fansly-repost-b",
    mediaId: "media-5",
    order: 0,
    isFreePreview: false,
    fanslyStatisticsId: "fixture-repost-stats-b",
  },
];
