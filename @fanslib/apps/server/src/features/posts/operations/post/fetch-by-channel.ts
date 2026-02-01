import { z } from "zod";
import { db } from "../../../../lib/db";
import { ChannelSchema } from "../../../channels/entity";
import { MediaSchema } from "../../../library/schema";
import { Post } from "../../entity";
import { PostMediaSchema, PostSchema } from "../../schema";

export const PostMediaWithMediaSchema = PostMediaSchema.extend({
  media: MediaSchema,
});

export const PostWithChannelAndMediaSchema = PostSchema.extend({
  postMedia: z.array(PostMediaWithMediaSchema),
  channel: ChannelSchema,
});

export const fetchPostsByChannel = async (channelId: string): Promise<z.infer<typeof PostWithChannelAndMediaSchema>[]> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Post);

  const posts = await repository.find({
    where: { channelId },
    relations: {
      postMedia: {
        media: true,
      },
      channel: {
        type: true,
        defaultHashtags: true,
      },
    },
    order: {
      date: "DESC",
      postMedia: {
        order: "ASC",
      },
    },
  });

  return posts.map((post) => ({
    ...post,
    postMedia: post.postMedia.filter((pm) => pm.media !== null),
  }));
};

