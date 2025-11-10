import { t } from "elysia";
import { db } from "../../../../lib/db";
import { Subreddit, SubredditSchema } from "../../entity";

export const FetchSubredditByIdRequestParamsSchema = t.Object({
  id: t.String(),
});

export const FetchSubredditByIdResponseSchema = t.Union([
  SubredditSchema,
  t.Object({ error: t.String() }),
]);

export const fetchSubredditById = async (
  payload: typeof FetchSubredditByIdRequestParamsSchema.static
): Promise<typeof FetchSubredditByIdResponseSchema.static> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Subreddit);
  const subreddit = await repository.findOne({ where: { id: payload.id } });
  if (!subreddit) {
    return { error: "Subreddit not found" };
  }
  return subreddit;
};

