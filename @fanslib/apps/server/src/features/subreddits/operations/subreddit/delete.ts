import { db } from "../../../../lib/db";
import { Subreddit } from "../../entity";

export const deleteSubreddit = async (id: string): Promise<void> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Subreddit);
  await repository.delete(id);
};

