import type { UpdateSubredditRequest } from "@fanslib/types";
import { db } from "../../../../lib/db";
import { Subreddit } from "../../entity";

export const updateSubreddit = async (
  id: string,
  updates: UpdateSubredditRequest
): Promise<Subreddit> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Subreddit);

  const subreddit = await repository.findOne({ where: { id } });
  if (!subreddit) {
    throw new Error(`Subreddit with id ${id} not found`);
  }

  Object.assign(subreddit, updates);
  await repository.save(subreddit);

  return subreddit;
};

