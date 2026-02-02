import { z } from "zod";
import { db } from "../../../../lib/db";
import { Subreddit, SubredditSchema } from "../../entity";

export const FetchSubredditByIdRequestParamsSchema = z.object({
  id: z.string(),
});

export const FetchSubredditByIdResponseSchema = SubredditSchema;

export const fetchSubredditById = async (
  id: string,
): Promise<z.infer<typeof FetchSubredditByIdResponseSchema> | null> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Subreddit);
  return repository.findOne({
    where: { id },
    relations: ["channel"],
  });
};
