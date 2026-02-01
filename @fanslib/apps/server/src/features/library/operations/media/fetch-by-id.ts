import { z } from "zod";
import { db } from "../../../../lib/db";
import { ChannelSchema } from "../../../channels/entity";
import { PostMediaSchema, PostSchema } from "../../../posts/schema";
import { SubredditSchema } from "../../../subreddits/entity";
import { Media } from "../../entity";
import { MediaSchema } from "../../schema";

export const FetchMediaByIdRequestParamsSchema = z.object({
  id: z.string(),
});

export const FetchMediaByIdResponseSchema = MediaSchema.extend({
  postMedia: z.array(PostMediaSchema.extend({
    post: PostSchema.extend({
      channel: ChannelSchema,
      subreddit: SubredditSchema.nullable().optional(),
    }),
  })),
});

export const fetchMediaById = async (id: string): Promise<z.infer<typeof FetchMediaByIdResponseSchema> | null> => {
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

