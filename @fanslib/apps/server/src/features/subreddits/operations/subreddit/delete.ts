import { z } from "zod";
import { db } from "../../../../lib/db";
import { Subreddit } from "../../entity";

export const DeleteSubredditParamsSchema = z.object({
  id: z.string(),
});

export const DeleteSubredditResponseSchema = z.object({
  success: z.boolean(),
});

export const deleteSubreddit = async (id: string): Promise<boolean> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Subreddit);
  const subreddit = await repository.findOne({ where: { id } });
  if (!subreddit) {
    return false;
  }
  await repository.delete({ id });
  return true;
};
