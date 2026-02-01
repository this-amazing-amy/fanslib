import { z } from "zod";
import { db } from "../../../../lib/db";
import { Hashtag, HashtagSchema } from "../../entity";

export const FetchHashtagsByIdsQuerySchema = z.object({
  ids: z.string().optional(), // JSON stringified number[]
});

export const FetchHashtagsByIdsResponseSchema = z.array(HashtagSchema);

export const fetchHashtagsByIds = async (ids: number[]): Promise<z.infer<typeof FetchHashtagsByIdsResponseSchema>> =>{
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

