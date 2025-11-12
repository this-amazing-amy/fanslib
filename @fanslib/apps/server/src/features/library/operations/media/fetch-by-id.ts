import { t } from "elysia";
import { ChannelSchema } from "~/features/channels/entity";
import { PostMediaSchema, PostSchema } from "~/features/posts/entity";
import { SubredditSchema } from "~/features/subreddits/entity";
import { db } from "../../../../lib/db";
import { Media, MediaSchema } from "../../entity";

export const FetchMediaByIdRequestParamsSchema = t.Object({
  id: t.String(),
});

export const FetchMediaByIdResponseSchema = t.Composite([
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
    shoots: t.Array(t.Any()),
  }),
]);

export const fetchMediaById = async (id: string): Promise<typeof FetchMediaByIdResponseSchema.static | null> => {
  const database = await db();

  const media = await database.manager.findOne(Media, {
    where: { id },
    relations: {
      postMedia: {
        post: {
          channel: true,
          subreddit: true,
        },
      },
      shoots: true,
      mediaTags: true,
    }
  })
  
    return media
};

