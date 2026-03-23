import { z } from "zod";

export const ActiveFypPostsQuerySchema = z.object({
  sortBy: z.enum(["views", "engagementPercent", "engagementSeconds"]).optional(),
});

const DatapointSchema = z.object({
  timestamp: z.number(),
  views: z.number(),
  interactionTime: z.number(),
});

export const ActiveFypPostItemSchema = z.object({
  postMediaId: z.string(),
  postId: z.string(),
  fanslyPostId: z.string().nullable(),
  mediaId: z.string(),
  caption: z.string().nullable(),
  totalViews: z.number(),
  averageEngagementPercent: z.number(),
  averageEngagementSeconds: z.number(),
  datapoints: z.array(DatapointSchema),
});

export const ActiveFypPostsResponseSchema = z.array(ActiveFypPostItemSchema);
