import { t } from "elysia";
import { db } from "../../../../lib/db";
import { Hashtag, HashtagChannelStatsSchema, HashtagSchema } from "../../entity";

export const FetchHashtagsByIdsQuerySchema = t.Object({
  ids: t.Optional(t.String()), // JSON stringified number[]
});

export const FetchHashtagsByIdsResponseSchema = t.Array(
  t.Composite([
    HashtagSchema,
    t.Object({
      channelStats: t.Array(HashtagChannelStatsSchema),
    }),
  ])
);

export const fetchHashtagsByIds = async (ids: number[]): Promise<typeof FetchHashtagsByIdsResponseSchema.static> =>{
  if (ids.length === 0) return [];

  const dataSource = await db();
  const repository = dataSource.getRepository(Hashtag);

  return repository.find({
    where: ids.map((id) => ({ id })),
    relations: {
      channelStats: true,
    },
  });
};

