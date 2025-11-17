import { t } from "elysia";
import { db } from "../../../../lib/db";
import { Hashtag, HashtagSchema } from "../../entity";

export const FetchAllHashtagsResponseSchema = t.Array(HashtagSchema);

export const fetchAllHashtags = async (): Promise<typeof FetchAllHashtagsResponseSchema.static> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Hashtag);

  return repository.find({
    relations: {
      channelStats: true,
    },
  });
};

