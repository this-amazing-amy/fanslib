import type { Channel, ChannelType } from "../channels/channel";
import type { Subreddit } from "../channels/subreddit";
import type { Media } from "../library/media";

export type PostStatus = "draft" | "scheduled" | "posted";

export type PostMedia = {
  id: string;
  order: number;
  isFreePreview: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Post = {
  id: string;
  createdAt: string;
  updatedAt: string;
  scheduleId?: string;
  caption?: string;
  date: string;
  url?: string;
  fanslyStatisticsId?: string;
  fypRemovedAt: Date | null;
  status: PostStatus;
  channelId: string;
  subredditId?: string;
};

export type PostWithoutRelations = Omit<Post, "channel" | "media" | "subreddit">;

export type PostMediaSelect = Pick<Media, "id" | "relativePath" | "type" | "name">;

export type PostMediaWithMediaSelect = Pick<PostMedia, "id" | "order" | "isFreePreview"> & {
  media: PostMediaSelect;
};

export type PostChannelSelect = Pick<Channel, "id" | "name"> & {
  type: Pick<ChannelType, "id" | "name">;
};

export type PostSubredditSelect = Pick<Subreddit, "id" | "name">;

export type PostFilters = {
  search?: string;
  channels?: string[];
  statuses?: PostStatus[];
  dateRange?: {
    startDate: string;
    endDate: string;
  };
};

