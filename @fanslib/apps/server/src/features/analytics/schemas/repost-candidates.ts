import { z } from "zod";

export const RepostCandidatesQuerySchema = z.object({
  sortBy: z.enum(["views", "engagementPercent", "engagementSeconds"]).optional(),
});

const DatapointSchema = z.object({
  timestamp: z.number(),
  views: z.number(),
  interactionTime: z.number(),
});

export const RepostCandidateItemSchema = z.object({
  mediaId: z.string(),
  postId: z.string(),
  caption: z.string().nullable(),
  totalViews: z.number(),
  averageEngagementPercent: z.number(),
  averageEngagementSeconds: z.number(),
  timesPosted: z.number(),
  datapoints: z.array(DatapointSchema),
});

export const RepostCandidatesResponseSchema = z.array(RepostCandidateItemSchema);
