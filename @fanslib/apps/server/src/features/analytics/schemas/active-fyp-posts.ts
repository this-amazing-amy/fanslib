import { z } from "zod";

export const ActiveFypPostsQuerySchema = z.object({
  sortBy: z.enum(["views", "engagementPercent", "engagementSeconds"]).optional(),
});

export const ActiveFypPostItemSchema = z.object({
  postMediaId: z.string(),
  postId: z.string(),
  mediaId: z.string(),
  caption: z.string().nullable(),
  totalViews: z.number(),
  averageEngagementPercent: z.number(),
  averageEngagementSeconds: z.number(),
});

export const ActiveFypPostsResponseSchema = z.array(ActiveFypPostItemSchema);
