import { z } from "zod";

export const RepostCandidatesQuerySchema = z.object({
  sortBy: z.enum(["views", "engagementPercent", "engagementSeconds"]).optional(),
});

export const RepostCandidateItemSchema = z.object({
  mediaId: z.string(),
  caption: z.string().nullable(),
  totalViews: z.number(),
  averageEngagementPercent: z.number(),
  averageEngagementSeconds: z.number(),
  timesPosted: z.number(),
});

export const RepostCandidatesResponseSchema = z.array(RepostCandidateItemSchema);
