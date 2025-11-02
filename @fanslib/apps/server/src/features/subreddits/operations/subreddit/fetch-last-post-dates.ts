import { db } from "../../../../lib/db";
import { Post } from "../../../posts/entity";

export const fetchLastPostDatesForSubreddits = async (
  subredditIds: string[]
): Promise<Record<string, string>> => {
  const dataSource = await db();

  const result = await dataSource
    .createQueryBuilder(Post, "post")
    .select("post.subredditId", "subredditId")
    .addSelect("MAX(post.date)", "lastPostDate")
    .where("post.subredditId IN (:...subredditIds)", { subredditIds })
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

