import { t } from "elysia";
import { ChannelSchema } from "~/features/channels/entity";
import { PostMediaSchema, PostSchema } from "~/features/posts/entity";
import { SubredditSchema } from "~/features/subreddits/entity";
import { db } from "../../../../lib/db";
import { Media, MediaSchema } from "../../entity";

export const FetchMediaByPathRequestParamsSchema = t.Object({
  path: t.String(),
});

export const FetchMediaByPathResponseSchema = t.Composite([
  MediaSchema,
  t.Object({
    postMedia: t.Array(t.Composite([
      PostMediaSchema,
      t.Object({
        post: t.Composite([
          PostSchema,
          t.Object({
            channel: ChannelSchema,
            subreddit: t.Optional(t.Nullable(SubredditSchema)),
          }),
        ]),
      }),
    ])),
  }),
]);

export const fetchMediaByPath = async (relativePath: string): Promise<typeof FetchMediaByPathResponseSchema.static | null> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Media);

  return repository.findOne({
    where: { relativePath },
    relations: {
      postMedia: {
        post: {
          channel: { type: true, defaultHashtags: true },
          subreddit: true,
        },
      },
    },
  });
};
