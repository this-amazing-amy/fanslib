import { t } from "elysia";
import { db } from "../../../../lib/db";
import { ChannelSchema } from "../../../channels/entity";
import { ContentScheduleSchema } from "../../../content-schedules/entity";
import { MediaSchema } from "../../../library/schema";
import { SubredditSchema } from "../../../subreddits/entity";
import { Post } from "../../entity";
import { PostMediaSchema, PostSchema } from "../../schema";

export const FetchPostByIdRequestParamsSchema = t.Object({
  id: t.String(),
});

export const FetchPostByIdResponseSchema = t.Composite([
  PostSchema,
  t.Object({
    postMedia: t.Array(t.Composite([
      PostMediaSchema,
      t.Object({
        media: MediaSchema,
      }),
    ])),
    channel: ChannelSchema,
    subreddit: t.Union([SubredditSchema, t.Null()]),
    schedule: t.Union([ContentScheduleSchema, t.Null()]),
  }),
]);

export const fetchPostById = async (id: string): Promise<typeof FetchPostByIdResponseSchema.static | null> => {
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

  return post ? {
    ...post,
    postMedia: post.postMedia.filter((pm) => pm.media !== null),
    schedule: post.schedule ?? null,
    subreddit: post.subreddit ?? null,
  } : null;
};

