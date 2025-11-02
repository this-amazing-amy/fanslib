export type UpdateHashtagStatsRequest = {
  channelId: string;
  views: number;
};

export type UpdateHashtagStatsResponse = {
  id: number;
  hashtagId: number;
  channelId: string;
  views: number;
  createdAt: Date;
  updatedAt: Date;
};

