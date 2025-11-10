import { t } from "elysia";
import { db } from "../../../../lib/db";
import { Hashtag, HashtagChannelStatsSchema, HashtagSchema } from "../../entity";

export const GetHashtagsByIdsQuerySchema = t.Object({
  ids: t.Optional(t.String()), // JSON stringified number[]
});

export const GetHashtagsByIdsResponseSchema = t.Array(t.Intersect([HashtagSchema, t.Object({
  channelStats: t.Array(HashtagChannelStatsSchema),
})]));

export const getHashtagsByIds = async (ids: number[]): Promise<typeof GetHashtagsByIdsResponseSchema.static> =>{
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

