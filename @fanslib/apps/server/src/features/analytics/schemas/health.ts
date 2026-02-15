import { z } from "zod";

export const StalePostSchema = z.object({
  postMediaId: z.string(),
  postDate: z.string(),
  mediaName: z.string(),
  mediaId: z.string(),
  daysSinceUpdate: z.number(),
});

export const AnalyticsHealthResponseSchema = z.object({
  coveragePercent: z.number(),
  totalCount: z.number(),
  matchedCount: z.number(),
  pendingMatches: z.number(),
  highConfidenceMatches: z.number(),
  staleCount: z.number(),
  unmatchedCount: z.number(),
  stalePosts: z.array(StalePostSchema),
});
