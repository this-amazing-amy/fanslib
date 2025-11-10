import { t } from "elysia";
import { db } from "../../../../lib/db";
import { Hashtag, HashtagChannelStatsSchema, HashtagSchema } from "../../entity";

export const GetAllHashtagsResponseSchema = t.Array(t.Intersect([HashtagSchema, t.Object({
  channelStats: t.Array(HashtagChannelStatsSchema),
})]));

export const getAllHashtags = async (): Promise<typeof GetAllHashtagsResponseSchema.static> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Hashtag);

  return repository.find({
    relations: {
      channelStats: true,
    },
  });
};

