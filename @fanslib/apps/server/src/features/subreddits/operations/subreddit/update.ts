import { z } from "zod";
import { db } from "../../../../lib/db";
import { Subreddit, SubredditSchema } from "../../entity";

export const UpdateSubredditRequestParamsSchema = z.object({
  id: z.string(),
});

export const UpdateSubredditRequestBodySchema = SubredditSchema.partial();
export const UpdateSubredditResponseSchema = SubredditSchema;

export const updateSubreddit = async (
  id: string,
  updates: z.infer<typeof UpdateSubredditRequestBodySchema>,
): Promise<Subreddit | null> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Subreddit);

  const subreddit = await repository.findOne({ where: { id } });
  if (!subreddit) {
    return null;
  }

  Object.assign(subreddit, updates);
  await repository.save(subreddit);

  return subreddit;
};
