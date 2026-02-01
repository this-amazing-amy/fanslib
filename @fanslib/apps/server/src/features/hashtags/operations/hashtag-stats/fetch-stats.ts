import { z } from "zod";
import { db } from "../../../../lib/db";
import { ChannelSchema } from "../../../channels/entity";
import { HashtagChannelStats, HashtagChannelStatsSchema } from "../../entity";

export const FetchHashtagStatsRequestParamsSchema = z.object({
  id: z.string(),
});

export const FetchHashtagStatsResponseSchema = z.array(
  HashtagChannelStatsSchema.extend({
    channel: ChannelSchema,
  })
);

export const fetchHashtagStats = async (hashtagId: number): Promise<z.infer<typeof FetchHashtagStatsResponseSchema>> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(HashtagChannelStats);

  return repository.find({
    where: { hashtagId },
    relations: {
      channel: {
        type: true,
        defaultHashtags: true,
      },
    },
  });
};

