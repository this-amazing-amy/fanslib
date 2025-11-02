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

export type CreatePostResponse = {
  id: string;
  createdAt: string;
  updatedAt: string;
  scheduleId?: string;
  caption?: string;
  date: string;
  url?: string;
  fanslyStatisticsId?: string;
  fypRemovedAt: Date | null;
  status: "draft" | "scheduled" | "posted";
  channelId: string;
  subredditId?: string;
  postMedia?: Array<{
    id: string;
    order: number;
    isFreePreview: boolean;
    media: {
      id: string;
      relativePath: string;
      type: "image" | "video";
      name: string;
    };
  }>;
  channel?: {
    id: string;
    name: string;
    type: {
      id: string;
      name: string;
    };
  };
  subreddit?: {
    id: string;
    name: string;
  };
};

