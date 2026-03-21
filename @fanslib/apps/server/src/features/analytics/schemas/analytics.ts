import { z } from "zod";

// FanslyPostWithAnalytics
export const FanslyPostWithAnalyticsSchema = z.object({
  id: z.string(),
  date: z.date(),
  caption: z.string(),
  thumbnailUrl: z.string(),
  postUrl: z.string().optional(),
  statisticsUrl: z.string().optional(),
  totalViews: z.number(),
  averageEngagementSeconds: z.number(),
  averageEngagementPercent: z.number(),
  hashtags: z.array(z.string()),
  videoLength: z.number(),
  media: z
    .object({
      id: z.string(),
      relativePath: z.string(),
      type: z.union([z.literal("image"), z.literal("video")]),
      name: z.string(),
      size: z.number(),
      duration: z.number().nullable(),
      redgifsUrl: z.string().nullable(),
      createdAt: z.date(),
      updatedAt: z.date(),
      fileCreationDate: z.date(),
      fileModificationDate: z.date(),
    })
    .optional(),
});
