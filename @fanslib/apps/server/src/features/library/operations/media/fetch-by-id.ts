import { t } from "elysia";
import { ChannelSchema } from "~/features/channels/entity";
import { PostMediaSchema, PostSchema } from "~/features/posts/entity";
import { SubredditSchema } from "~/features/subreddits/entity";
import { db } from "../../../../lib/db";
import { Media, MediaSchema } from "../../entity";

export const GetMediaByIdRequestParamsSchema = t.Object({
  id: t.String(),
});

export const GetMediaByIdResponseSchema = t.Union([
  t.Intersect([MediaSchema, t.Object({
    postMedia: t.Array(t.Intersect([PostMediaSchema, t.Object({
      post: t.Intersect([PostSchema, t.Object({
        channel: ChannelSchema,
        subreddit: t.Optional(SubredditSchema),
      })])})]))})]),
  t.Object({ error: t.String() }),
  t.Null(),
]);

export const getMediaById = async (id: string): Promise<typeof GetMediaByIdResponseSchema.static> => {
  const database = await db();

  return database.manager.findOne(Media, {
    where: { id },
    relations: {
      postMedia: {
        post: {
          channel: true,
          subreddit: true,
        },
      },
      mediaTags: true,
    },
  });
};

