import { t } from "elysia";
import { db } from "../../../../lib/db";
import { Subreddit, SubredditSchema } from "../../entity";

export const UpdateSubredditRequestParamsSchema = t.Object({
  id: t.String(),
});

export const UpdateSubredditRequestBodySchema = t.Partial(SubredditSchema);
export const UpdateSubredditResponseSchema = SubredditSchema;

export const updateSubreddit = async (
  id: string,
  updates: typeof UpdateSubredditRequestBodySchema.static
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
