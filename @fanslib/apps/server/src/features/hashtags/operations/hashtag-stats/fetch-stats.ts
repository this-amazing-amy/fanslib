import { t } from "elysia";
import { ChannelSchema } from "~/features/channels/entity";
import { db } from "../../../../lib/db";
import { HashtagChannelStats, HashtagChannelStatsSchema } from "../../entity";

export const GetHashtagStatsRequestParamsSchema = t.Object({
  id: t.String(),
});

export const GetHashtagStatsResponseSchema = t.Array(t.Intersect([HashtagChannelStatsSchema, t.Object({ channel: ChannelSchema })]));

export const getHashtagStats = async (hashtagId: number): Promise<typeof GetHashtagStatsResponseSchema.static> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(HashtagChannelStats);

  return repository.find({
    where: { hashtagId },
    relations: {
      channel: true,
    },
  });
};

