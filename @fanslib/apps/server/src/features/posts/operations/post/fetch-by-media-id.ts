import { z } from "zod";
import { In } from "typeorm";
import { db } from "../../../../lib/db";
import { ChannelSchema, ChannelTypeSchema } from "../../../channels/entity";
import { MediaSchema } from "../../../library/schema";
import { Post } from "../../entity";
import { PostMediaSchema, PostSchema } from "../../schema";

export const PostMediaWithMediaSchema = PostMediaSchema.extend({
  media: MediaSchema,
});

export const ChannelWithTypeSchema = ChannelSchema.extend({
  type: ChannelTypeSchema,
});

export const PostWithChannelAndMediaSchema = PostSchema.extend({
  postMedia: z.array(PostMediaWithMediaSchema),
  channel: ChannelWithTypeSchema,
});

export const fetchPostsByMediaId = async (
  mediaId: string
): Promise<z.infer<typeof PostWithChannelAndMediaSchema>[]> => {
  const repository = (await db()).getRepository(Post);

  const postsWithMedia = await repository
    .createQueryBuilder("post")
    .innerJoin("post.postMedia", "pm")
    .innerJoin("pm.media", "media")
    .where("media.id = :mediaId", { mediaId })
    .select("post.id")
    .getMany();

  if (postsWithMedia.length === 0) {
    return [];
  }

  const posts = await repository.find({
    where: {
      id: In(postsWithMedia.map((p) => p.id)),
    },
    relations: {
      postMedia: {
        media: true,
      },
      channel: {
        type: true,
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

