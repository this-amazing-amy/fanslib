import { z } from "zod";
import { db } from "../../../../lib/db";
import { ChannelSchema } from "../../../channels/entity";
import { PostMediaSchema, PostSchema } from "../../../posts/schema";
import { ShootSchema } from "../../../shoots/entity";
import { SubredditSchema } from "../../../subreddits/entity";
import { Media } from "../../entity";
import { MediaSchema } from "../../schema";

export const FetchMediaByIdRequestParamsSchema = z.object({
  id: z.string(),
});

export const FetchMediaByIdResponseSchema = MediaSchema.extend({
  postMedia: z.array(
    PostMediaSchema.extend({
      post: PostSchema.extend({
        channel: ChannelSchema,
        subreddit: SubredditSchema.nullable().optional(),
      }),
    }),
  ),
  shoots: z.array(ShootSchema.pick({ id: true, name: true })),
});

export const fetchMediaById = async (
  id: string,
): Promise<z.infer<typeof FetchMediaByIdResponseSchema> | null> => {
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
      shoots: true,
    },
  });

  if (!media) {
    return null;
  }

  return {
    ...media,
    postMedia: media.postMedia.filter((pm) => pm.post !== null && pm.post !== undefined),
    shoots: media.shoots.map((s) => ({ id: s.id, name: s.name })),
  };
};
