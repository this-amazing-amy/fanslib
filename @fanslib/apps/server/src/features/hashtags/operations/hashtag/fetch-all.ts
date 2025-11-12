import { t } from "elysia";
import { db } from "../../../../lib/db";
import { Hashtag, HashtagChannelStatsSchema, HashtagSchema } from "../../entity";

export const FetchAllHashtagsResponseSchema = t.Array(t.Composite([
  HashtagSchema,
  t.Object({
    channelStats: t.Array(HashtagChannelStatsSchema),
  }),
]));

export const fetchAllHashtags = async (): Promise<typeof FetchAllHashtagsResponseSchema.static> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Hashtag);

  return repository.find({
    relations: {
      channelStats: true,
    },
  });
};

