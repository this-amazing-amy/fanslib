import type { Post, PostMedia } from "./entity";

export type PostFixture = Pick<Post, "id" | "channelId" | "subredditId" | "caption" | "status" | "date">;

export const POST_FIXTURES: PostFixture[] = [
  {
    id: "post-1",
    channelId: "channel-1",
    caption: "Check out this amazing content!",
    status: "draft",
    date: new Date("2024-01-15"),
    subredditId: null
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
    subredditId: null
  },
];

export type PostMediaFixture = Pick<PostMedia, "order" | "isFreePreview"> & {
  postId: string;
  mediaId: string;
};

export const POST_MEDIA_FIXTURES: PostMediaFixture[] = [
  { postId: "post-1", mediaId: "media-1", order: 0, isFreePreview: true },
  { postId: "post-1", mediaId: "media-2", order: 1, isFreePreview: false },
  { postId: "post-2", mediaId: "media-3", order: 0, isFreePreview: true },
  { postId: "post-3", mediaId: "media-4", order: 0, isFreePreview: false },
];
