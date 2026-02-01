import { z } from "zod";
import { db } from "../../../../lib/db";
import { Subreddit, SubredditSchema } from "../../entity";

export const FetchAllSubredditsResponseSchema = z.array(SubredditSchema);

export const fetchAllSubreddits = async (): Promise<
  z.infer<typeof FetchAllSubredditsResponseSchema>
> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Subreddit);

  return repository.find({
    order: {
      memberCount: "DESC",
    },
  });
};
