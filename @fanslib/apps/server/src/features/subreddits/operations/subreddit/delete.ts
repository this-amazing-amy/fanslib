import { t } from "elysia";
import { db } from "../../../../lib/db";
import { Subreddit } from "../../entity";

export const DeleteSubredditParamsSchema = t.Object({
  id: t.String(),
});

export const DeleteSubredditResponseSchema = t.Object({
  success: t.Boolean(),
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

