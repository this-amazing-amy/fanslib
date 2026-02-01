import { z } from "zod";
import { HashtagChannelStatsSchema } from "../../entity";
import { incrementHashtagViews } from "./increment-views";

export const UpdateHashtagStatsRequestParamsSchema = z.object({
  id: z.string(),
});

export const UpdateHashtagStatsRequestBodySchema = z.object({
  channelId: z.string(),
  views: z.number(),
});

export const UpdateHashtagStatsResponseSchema = HashtagChannelStatsSchema;

export const updateHashtagStats = async (
  hashtagId: number,
  channelId: string,
  views: number
): Promise<z.infer<typeof UpdateHashtagStatsResponseSchema>> =>
  incrementHashtagViews(hashtagId, channelId, views);

