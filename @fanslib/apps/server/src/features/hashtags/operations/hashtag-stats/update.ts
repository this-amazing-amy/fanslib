import { t } from "elysia";
import { HashtagChannelStatsSchema } from "../../entity";
import { incrementHashtagViews } from "./increment-views";

export const UpdateHashtagStatsRequestParamsSchema = t.Object({
  id: t.String(),
});

export const UpdateHashtagStatsRequestBodySchema = t.Object({
  channelId: t.String(),
  views: t.Number(),
});

export const UpdateHashtagStatsResponseSchema = HashtagChannelStatsSchema;

export const updateHashtagStats = async (
  hashtagId: number,
  channelId: string,
  views: number
): Promise<typeof UpdateHashtagStatsResponseSchema.static> =>
  incrementHashtagViews(hashtagId, channelId, views);

