import { z } from "zod";
import { db } from "../../../../lib/db";
import { ChannelSchema } from "../../../channels/entity";
import { PostMediaSchema, PostSchema } from "../../../posts/schema";
import { SubredditSchema } from "../../../subreddits/entity";
import { Media } from "../../entity";
import { MediaSchema } from "../../schema";

export const FetchMediaByPathRequestParamsSchema = z.object({
  path: z.string(),
});

export const FetchMediaByPathResponseSchema = MediaSchema.extend({
  postMedia: z.array(PostMediaSchema.extend({
    post: PostSchema.extend({
      channel: ChannelSchema,
      subreddit: SubredditSchema.nullable().optional(),
    }),
  })),
});

export const fetchMediaByPath = async (relativePath: string): Promise<z.infer<typeof FetchMediaByPathResponseSchema> | null> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Media);

  const media = await repository.findOne({
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

  if (!media) {
    return null;
  }

  return {
    ...media,
    postMedia: media.postMedia.filter((pm) => pm.post !== null && pm.post !== undefined),
  };
};
