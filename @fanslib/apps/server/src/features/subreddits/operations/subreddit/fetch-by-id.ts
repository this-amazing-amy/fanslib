import { db } from "../../../../lib/db";
import { Subreddit } from "../../entity";

export const fetchSubredditById = async (
  id: string
): Promise<Subreddit | null> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Subreddit);
  return repository.findOne({ where: { id } });
};

