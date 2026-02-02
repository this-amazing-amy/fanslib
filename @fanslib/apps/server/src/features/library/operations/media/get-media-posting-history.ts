import { z } from "zod";
import { db } from "../../../../lib/db";
import { Post } from "../../../posts/entity";
import { ChannelSchema } from "../../../channels/entity";

export const PostWithChannelSchema = z.object({
  id: z.string(),
  caption: z.string().nullable(),
  status: z.enum(["draft", "ready", "scheduled", "posted"]),
  date: z.coerce.date(),
  channelId: z.string(),
  channel: ChannelSchema,
});

export const GetMediaPostingHistoryResponseSchema = z.object({
  totalPosts: z.number(),
  lastPostedAt: z.coerce.date().nullable(),
  postsByChannel: z.array(PostWithChannelSchema),
});

export const getMediaPostingHistory = async (
  mediaId: string,
): Promise<z.infer<typeof GetMediaPostingHistoryResponseSchema>> => {
  const database = await db();
  const postRepo = database.getRepository(Post);

  // Get all posts that include this media with channel relation
  const posts = await postRepo
    .createQueryBuilder("p")
    .innerJoin("post_media", "pm", "pm.postId = p.id")
    .innerJoinAndSelect("p.channel", "channel")
    .where("pm.mediaId = :mediaId", { mediaId })
    .orderBy("p.date", "DESC")
    .getMany();

  const totalPosts = posts.length;
  const lastPostedAt = posts.length > 0 ? posts[0].date : null;

  return {
    totalPosts,
    lastPostedAt,
    postsByChannel: posts,
  };
};
