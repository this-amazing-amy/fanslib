import { z } from "zod";

export const FypPostSchema = z.object({
  postId: z.string(),
  postDate: z.string(),
  mediaId: z.string(),
  totalViews: z.number(),
  avgEngagementSeconds: z.number(),
  percentVsAverage: z.number(),
  plateauDaysSincePosted: z.number().nullable(),
  daysSincePosted: z.number(),
});

export const FypActionsQuerySchema = z.object({
  thresholdType: z.union([z.literal("views"), z.literal("engagement")]).optional(),
  thresholdValue: z.number().optional(),
});

export const FypActionsResponseSchema = z.object({
  userAverageViews: z.number(),
  userAverageEngagementSeconds: z.number(),
  activeOnFypCount: z.number(),
  considerRemoving: z.array(FypPostSchema),
  readyToRepost: z.array(FypPostSchema),
});
