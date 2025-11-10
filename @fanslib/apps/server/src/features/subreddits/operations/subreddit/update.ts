import { t } from "elysia";
import { db } from "../../../../lib/db";
import { Subreddit, SubredditSchema } from "../../entity";

export const UpdateSubredditRequestParamsSchema = t.Object({
  id: t.String(),
});

export const UpdateSubredditRequestBodySchema = t.Partial(SubredditSchema);
export const UpdateSubredditResponseSchema = SubredditSchema;

export const updateSubreddit = async (
  payload: typeof UpdateSubredditRequestParamsSchema.static,
  updates: typeof UpdateSubredditRequestBodySchema.static
): Promise<Subreddit> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Subreddit);

  const subreddit = await repository.findOne({ where: { id: payload.id } });
  if (!subreddit) {
    throw new Error(`Subreddit with id ${payload.id} not found`);
  }

  Object.assign(subreddit, updates);
  await repository.save(subreddit);

  return subreddit;
};
