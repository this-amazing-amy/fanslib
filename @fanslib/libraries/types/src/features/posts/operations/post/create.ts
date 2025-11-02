import type {
  Post,
  PostChannelSelect,
  PostMediaWithMediaSelect,
  PostSubredditSelect,
} from "../../post";

export type CreatePostRequest = {
  date: string;
  channelId: string;
  caption?: string;
  status: "draft" | "scheduled" | "posted";
  url?: string;
  fanslyStatisticsId?: string;
  subredditId?: string;
  fypRemovedAt?: Date | null;
  mediaIds?: string[];
};

export type CreatePostResponse = Post & {
  postMedia?: PostMediaWithMediaSelect[];
  channel?: PostChannelSelect;
  subreddit?: PostSubredditSelect;
};

