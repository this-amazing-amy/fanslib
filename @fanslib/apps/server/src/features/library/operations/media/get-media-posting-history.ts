import { z } from "zod";
import { db } from "../../../../lib/db";
import { PostSchema } from "../../../posts/entity";

export const GetMediaPostingHistoryResponseSchema = z.object({
  totalPosts: z.number(),
  lastPostedAt: z.string().nullable(),
  postsByChannel: z.array(PostSchema),
});

export const getMediaPostingHistory = async (
  mediaId: string,
): Promise<z.infer<typeof GetMediaPostingHistoryResponseSchema>> => {
  const database = await db();

  // Get all posts that include this media
  const posts = await database.manager
    .createQueryBuilder()
    .select("p.*")
    .from("post", "p")
    .innerJoin("post_media", "pm", "pm.postId = p.id")
    .where("pm.mediaId = :mediaId", { mediaId })
    .orderBy("p.scheduledFor", "DESC")
    .getRawMany();

  const totalPosts = posts.length;
  const lastPostedAt = posts.length > 0 ? posts[0].scheduledFor : null;

  return {
    totalPosts,
    lastPostedAt,
    postsByChannel: posts,
  };
};
