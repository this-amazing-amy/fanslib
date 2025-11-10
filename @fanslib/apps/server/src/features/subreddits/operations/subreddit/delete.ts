import { t } from "elysia";
import { db } from "../../../../lib/db";
import { Subreddit } from "../../entity";

export const DeleteSubredditParamsSchema = t.Object({
  id: t.String(),
});

export const DeleteSubredditResponseSchema = t.Object({
  success: t.Boolean(),
});

export const deleteSubreddit = async (payload: typeof DeleteSubredditParamsSchema.static): Promise<typeof DeleteSubredditResponseSchema.static> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Subreddit);
  await repository.delete({ id: payload.id });
  return { success: true };
};

