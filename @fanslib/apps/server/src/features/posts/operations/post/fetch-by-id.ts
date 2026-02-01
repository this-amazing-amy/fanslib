import { z } from "zod";
import { db } from "../../../../lib/db";
import { ChannelSchema } from "../../../channels/entity";
import { ContentScheduleSchema } from "../../../content-schedules/entity";
import { MediaSchema } from "../../../library/schema";
import { SubredditSchema } from "../../../subreddits/entity";
import { Post } from "../../entity";
import { PostMediaSchema, PostSchema } from "../../schema";

export const PostMediaWithMediaSchema = PostMediaSchema.extend({
  media: MediaSchema,
});

export const PostWithRelationsSchema = PostSchema.extend({
  postMedia: z.array(PostMediaWithMediaSchema),
  channel: ChannelSchema,
  subreddit: SubredditSchema.nullable(),
  schedule: ContentScheduleSchema.nullable(),
});

export type PostWithRelations = z.infer<typeof PostWithRelationsSchema>;

export const fetchPostById = async (id: string): Promise<PostWithRelations | null> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Post);

  const post = await repository.findOne({
    where: { id },
    relations: {
      postMedia: {
        media: true,
      },
      channel: {
        type: true,
        defaultHashtags: true,
      },
      subreddit: true,
      schedule: true,
    },
    order: {
      postMedia: {
        order: "ASC",
      },
    },
  });

  if (!post) return null;

  return {
    ...post,
    postMedia: post.postMedia.filter((pm) => pm.media !== null),
    schedule: post.schedule ?? null,
    subreddit: post.subreddit ?? null,
  };
};

