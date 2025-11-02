export type Hashtag = {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export type HashtagChannelStats = {
  id: number;
  hashtagId: number;
  channelId: string;
  views: number;
  createdAt: Date;
  updatedAt: Date;
};

export type HashtagWithStats = Hashtag & {
  channelStats: HashtagChannelStats[];
};

