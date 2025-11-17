import { t } from "elysia";
import { ChannelSchema } from "~/features/channels/entity";
import { db } from "../../../../lib/db";
import { HashtagChannelStats, HashtagChannelStatsSchema } from "../../entity";

export const FetchHashtagStatsRequestParamsSchema = t.Object({
  id: t.String(),
});

export const FetchHashtagStatsResponseSchema = t.Array(t.Composite([
  HashtagChannelStatsSchema,
  t.Object({ channel: ChannelSchema }),
]));

export const fetchHashtagStats = async (hashtagId: number): Promise<typeof FetchHashtagStatsResponseSchema.static> => {
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

