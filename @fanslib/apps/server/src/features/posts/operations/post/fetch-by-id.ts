import { t } from "elysia";
import { ChannelSchema } from "~/features/channels/entity";
import { MediaSchema } from "~/features/library/entity";
import { SubredditSchema } from "~/features/subreddits/entity";
import { db } from "../../../../lib/db";
import { Post, PostMediaSchema, PostSchema } from "../../entity";

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
    subreddit: t.Optional(t.Partial(SubredditSchema)),
  }),
]);

export const fetchPostById = async (id: string): Promise<typeof FetchPostByIdResponseSchema.static | null> => {
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

