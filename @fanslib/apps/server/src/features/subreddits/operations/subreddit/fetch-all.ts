import { db } from "../../../../lib/db";
import { Subreddit } from "../../entity";

export const fetchAllSubreddits = async (): Promise<Subreddit[]> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Subreddit);

  return repository.find({
    order: {
      memberCount: "DESC",
    },
  });
};

