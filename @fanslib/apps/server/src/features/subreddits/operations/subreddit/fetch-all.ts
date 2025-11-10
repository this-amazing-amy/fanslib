import { t } from "elysia";
import { db } from "../../../../lib/db";
import { Subreddit, SubredditSchema } from "../../entity";

export const FetchAllSubredditsResponseSchema = t.Array(SubredditSchema);

export const fetchAllSubreddits = async (): Promise<typeof FetchAllSubredditsResponseSchema.static> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Subreddit);

  return repository.find({
    order: {
      memberCount: "DESC",
    },
  });
};

