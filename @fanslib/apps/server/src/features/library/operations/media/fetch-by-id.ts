import { t } from "elysia";
import { db } from "../../../../lib/db";
import { ChannelSchema } from "../../../channels/entity";
import { PostMediaSchema, PostSchema } from "../../../posts/schema";
import { SubredditSchema } from "../../../subreddits/entity";
import { Media } from "../../entity";
import { MediaSchema } from "../../schema";

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
  }),
]);

export const fetchMediaById = async (id: string): Promise<typeof FetchMediaByIdResponseSchema.static | null> => {
  const database = await db();

  const media = await database.manager.findOne(Media, {
    where: { id },
    relations: {
      postMedia: {
        post: {
          channel: { type: true, defaultHashtags: true },
          subreddit: true,
        },
      },
    }
  })
  
  if (!media) {
    return null;
  }

  return {
    ...media,
    postMedia: media.postMedia.filter((pm) => pm.post !== null && pm.post !== undefined),
  };
};

