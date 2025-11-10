import { t } from "elysia";
import { ChannelSchema, ChannelTypeSchema } from "~/features/channels/entity";
import { HashtagSchema } from "~/features/hashtags/entity";
import { MediaSchema } from "~/features/library/entity";
import { SubredditSchema } from "~/features/subreddits/entity";
import { db } from "../../../../lib/db";
import { Post, PostMediaSchema, PostSchema } from "../../entity";

export const GetPostByIdRequestParamsSchema = t.Object({
  id: t.String(),
});

export const GetPostByIdResponseSchema = t.Union([
  t.Intersect([PostSchema, t.Object({
    postMedia: t.Array(t.Intersect([PostMediaSchema, t.Object({
      media: MediaSchema,
    })])),
    channel: t.Intersect([ChannelSchema, t.Object({
      type: ChannelTypeSchema,
      defaultHashtags: t.Array(HashtagSchema),
    })]),
    subreddit: t.Optional(SubredditSchema),
  })]),
  t.Object({ error: t.String() }),
  t.Null(),
]);

export const getPostById = async (id: string): Promise<typeof GetPostByIdResponseSchema.static> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Post);

  return repository.findOne({
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
    },
    order: {
      postMedia: {
        order: "ASC",
      },
    },
  });
};

