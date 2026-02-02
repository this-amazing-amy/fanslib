import { z } from "zod";
import { db } from "../../../../lib/db";
import { Post } from "../../entity";
import { PostSchema } from "../../entity";

export const FetchRecentPostsRequestSchema = z.object({
  channelId: z.string(),
  limit: z.number().int().min(1).max(10).optional().default(3),
});

export const FetchRecentPostsResponseSchema = z.array(PostSchema);

/**
 * Fetch recent posts for a specific channel
 * Returns posts ordered by scheduledFor date (most recent first)
 * Includes post media relationships for thumbnails
 */
export const fetchRecentPosts = async (
  params: z.infer<typeof FetchRecentPostsRequestSchema>,
): Promise<z.infer<typeof FetchRecentPostsResponseSchema>> => {
  const { channelId, limit } = params;

  const database = await db();
  const posts = await database.manager
    .createQueryBuilder(Post, "post")
    .leftJoinAndSelect("post.postMedia", "postMedia")
    .leftJoinAndSelect("postMedia.media", "media")
    .leftJoinAndSelect("post.channel", "channel")
    .leftJoinAndSelect("post.subreddit", "subreddit")
    .where("post.channelId = :channelId", { channelId })
    .andWhere("post.date <= :now", { now: new Date().toISOString() })
    .orderBy("post.date", "DESC")
    .limit(limit)
    .getMany();

  return posts;
};
