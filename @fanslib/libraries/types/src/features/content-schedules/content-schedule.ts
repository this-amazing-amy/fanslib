export type ContentSchedule = {
  id: string;
  channelId: string;
  type: "daily" | "weekly" | "monthly";
  postsPerTimeframe?: number;
  preferredDays?: string[];
  preferredTimes?: string[];
  mediaFilters?: string;
  updatedAt: string;
  createdAt: string;
};

export type ContentScheduleWithoutRelations = Omit<ContentSchedule, "channel">;

