import { t } from "elysia";
import { db } from "../../../../lib/db";
import { ChannelSchema } from "../../../channels/entity";
import { PostMediaSchema, PostSchema } from "../../../posts/entity";
import { SubredditSchema } from "../../../subreddits/entity";
import { Media, MediaSchema, MediaTypeSchema } from "../../entity";

export const UpdateMediaRequestParamsSchema = t.Object({
  id: t.String(),
});

export const UpdateMediaRequestBodySchema = t.Partial(t.Object({
  relativePath: t.String(),
  type: MediaTypeSchema,
  name: t.String(),
  size: t.Number(),
  duration: t.Optional(t.Number()),
  redgifsUrl: t.Union([t.String(), t.Null()]),
  fileCreationDate: t.Date(),
  fileModificationDate: t.Date(),
}));

export const UpdateMediaResponseSchema = t.Composite([
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

export const updateMedia = async (id: string, updates: typeof UpdateMediaRequestBodySchema.static): Promise<typeof UpdateMediaResponseSchema.static | null> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Media);

  const media = await repository.findOne({
    where: { id },
    relations: {
      postMedia: {
        post: {
          channel: { type: true, defaultHashtags: true },
          subreddit: true,
        },
      },
    },
  });

  if (!media) return null;

  Object.assign(media, updates);
  await repository.save(media);

  const updatedMedia = await repository.findOne({
    where: { id },
    relations: {
      postMedia: {
        post: {
          channel: { type: true, defaultHashtags: true },
          subreddit: true,
        },
      },
    },
  });

  if (!updatedMedia) return null;

  return {
    ...updatedMedia,
    postMedia: updatedMedia.postMedia.filter((pm) => pm.post !== null && pm.post !== undefined),
  };
};

