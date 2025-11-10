import { t } from "elysia";
import { db } from "../../../../lib/db";
import { Post } from "../../../posts/entity";

export const FetchLastPostDatesRequestBodySchema = t.Object({
  subredditIds: t.Array(t.String()),
});

export const FetchLastPostDatesResponseSchema = t.Record(t.String(), t.String());

export const fetchLastPostDatesForSubreddits = async (
  payload: typeof FetchLastPostDatesRequestBodySchema.static
): Promise<typeof FetchLastPostDatesResponseSchema.static> => {
  const dataSource = await db();

  const result = await dataSource
    .createQueryBuilder(Post, "post")
    .select("post.subredditId", "subredditId")
    .addSelect("MAX(post.date)", "lastPostDate")
    .where("post.subredditId IN (:...subredditIds)", { subredditIds: payload.subredditIds })
    .andWhere("post.status = :status", { status: "posted" })
    .groupBy("post.subredditId")
    .getRawMany();

  return result.reduce(
    (acc, { subredditId, lastPostDate }) => {
      acc[subredditId] = lastPostDate;
      return acc;
    },
    {} as Record<string, string>
  );
};

