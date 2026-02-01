import { z } from "zod";
import { db } from "../../../../lib/db";
import { Post } from "../../../posts/entity";

export const FetchLastPostDatesRequestBodySchema = z.object({
  subredditIds: z.array(z.string()),
});

export const FetchLastPostDatesResponseSchema = z.record(z.string(), z.date());

export const fetchLastPostDatesForSubreddits = async (
  payload: z.infer<typeof FetchLastPostDatesRequestBodySchema>,
): Promise<z.infer<typeof FetchLastPostDatesResponseSchema>> => {
  const dataSource = await db();

  const result = await dataSource
    .createQueryBuilder(Post, "post")
    .select("post.subredditId", "subredditId")
    .addSelect("MAX(post.date)", "lastPostDate")
    .where("post.subredditId IN (:...subredditIds)", {
      subredditIds: payload.subredditIds,
    })
    .andWhere("post.status = :status", { status: "posted" })
    .groupBy("post.subredditId")
    .getRawMany();

  return result.reduce(
    (acc, { subredditId, lastPostDate }) => {
      acc[subredditId] = new Date(lastPostDate);
      return acc;
    },
    {} as Record<string, Date>,
  );
};
