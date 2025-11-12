import { t } from "elysia";
import { db } from "../../../../lib/db";
import { Subreddit, SubredditSchema } from "../../entity";

export const FetchSubredditByIdRequestParamsSchema = t.Object({
  id: t.String(),
});

export const FetchSubredditByIdResponseSchema = SubredditSchema;

export const fetchSubredditById = async (
  id: string
): Promise<typeof FetchSubredditByIdResponseSchema.static | null> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Subreddit);
  return repository.findOne({ where: { id } });
};

