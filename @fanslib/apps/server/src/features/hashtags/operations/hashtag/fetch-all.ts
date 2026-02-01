import { z } from "zod";
import { db } from "../../../../lib/db";
import { Hashtag, HashtagSchema } from "../../entity";

export const FetchAllHashtagsResponseSchema = z.array(HashtagSchema);

export const fetchAllHashtags = async (): Promise<z.infer<typeof FetchAllHashtagsResponseSchema>> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Hashtag);

  return repository.find({
    relations: {
      channelStats: true,
    },
  });
};

