import { z } from "zod";
import { db } from "../../../../lib/db";
import { ChannelSchema } from "../../../channels/entity";
import { PostMediaSchema, PostSchema } from "../../../posts/schema";
import { SubredditSchema } from "../../../subreddits/entity";
import { Media } from "../../entity";
import { MediaSchema, MediaTypeSchema } from "../../schema";

export const UpdateMediaRequestParamsSchema = z.object({
  id: z.string(),
});

export const UpdateMediaRequestBodySchema = z.object({
  relativePath: z.string().optional(),
  type: MediaTypeSchema.optional(),
  name: z.string().optional(),
  size: z.number().optional(),
  duration: z.number().optional(),
  redgifsUrl: z.string().nullable().optional(),
  fileCreationDate: z.coerce.date().optional(),
  fileModificationDate: z.coerce.date().optional(),
});

export const UpdateMediaResponseSchema = MediaSchema.extend({
  postMedia: z.array(PostMediaSchema.extend({
    post: PostSchema.extend({
      channel: ChannelSchema,
      subreddit: SubredditSchema.nullable().optional(),
    }),
  })),
});

export const updateMedia = async (id: string, updates: z.infer<typeof UpdateMediaRequestBodySchema>): Promise<z.infer<typeof UpdateMediaResponseSchema> | null> => {
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

