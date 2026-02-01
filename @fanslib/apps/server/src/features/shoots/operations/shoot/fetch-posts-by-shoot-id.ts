import { z } from "zod";
import { In } from "typeorm";
import { db } from "../../../../lib/db";
import { ChannelSchema, ChannelTypeSchema } from "../../../channels/entity";
import { MediaSchema } from "../../../library/schema";
import { Post } from "../../../posts/entity";
import { PostMediaSchema, PostSchema } from "../../../posts/schema";
import { Shoot } from "../../entity";

export const FetchPostsByShootIdRequestParamsSchema = z.object({
  id: z.string(),
});

export const FetchPostsByShootIdResponseSchema = z.array(
  PostSchema.extend({
    postMedia: z.array(
      PostMediaSchema.extend({
        media: MediaSchema,
      })
    ),
    channel: ChannelSchema.extend({
      type: ChannelTypeSchema,
    }),
  })
);

export const fetchPostsByShootId = async (
  shootId: string
): Promise<z.infer<typeof FetchPostsByShootIdResponseSchema>> => {
  const repository = (await db()).getRepository(Post);

  // First, get all media IDs that belong to this shoot
  const database = await db();
  const shootRepository = database.getRepository(Shoot);
  const shoot = await shootRepository.findOne({
    where: { id: shootId },
    relations: ["media"],
  });

  if (!shoot?.media?.length) {
    return [];
  }

  const mediaIds = shoot.media.map((m: { id: string }) => m.id);

  // Find posts that contain any of these media
  const postsWithMedia = await repository
    .createQueryBuilder("post")
    .innerJoin("post.postMedia", "pm")
    .innerJoin("pm.media", "media")
    .where("media.id IN (:...mediaIds)", { mediaIds })
    .select("post.id")
    .distinct(true)
    .getMany();

  if (postsWithMedia.length === 0) {
    return [];
  }

  // Fetch the complete posts with all their relations
  const posts = await repository.find({
    where: {
      id: In(postsWithMedia.map((p) => p.id)),
    },
    relations: {
      postMedia: {
        media: true,
      },
      channel: {
        type: true,
      },
    },
    order: {
      date: "DESC",
      postMedia: {
        order: "ASC",
      },
    },
  });

  return posts;
};

