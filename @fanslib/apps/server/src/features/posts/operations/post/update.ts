import { z } from "zod";
import { In } from "typeorm";
import { db } from "../../../../lib/db";
import { CHANNEL_TYPES } from "../../../channels/channelTypes";
import { Post } from "../../entity";
import { PostSchema } from "../../schema";
import { validatePost } from "../../../api-bluesky/operations/validate-post";
import type { PostWithRelations } from "./fetch-by-id";
import { fetchPostById } from "./fetch-by-id";

export const UpdatePostRequestBodySchema = PostSchema.partial().extend({
  syncToPostIds: z.array(z.string()).optional(),
});

export const updatePost = async (
  id: string,
  updates: z.infer<typeof UpdatePostRequestBodySchema>
): Promise<PostWithRelations | null> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Post);

  const post = await repository.findOne({
    where: { id },
    relations: {
      postMedia: {
        media: true,
      },
      channel: true,
    },
    order: {
      postMedia: {
        order: "ASC",
      },
    },
  });

  if (!post) return null;

  const { syncToPostIds = [], ...postUpdates } = updates;
  const isStatusChangeToScheduled =
    postUpdates.status === "scheduled" && post.status !== "scheduled";
  const isBlueskyPost = post.channel.typeId === CHANNEL_TYPES.bluesky.id;

  if (isStatusChangeToScheduled && isBlueskyPost) {
    const media = post.postMedia
      .filter((pm) => pm.media !== null)
      .map((pm) => pm.media)
      .filter((m): m is NonNullable<typeof m> => m !== null);

    const validation = await validatePost(postUpdates.caption ?? post.caption, media);

    if (!validation.valid) {
      throw new Error(
        `Cannot schedule Bluesky post: ${validation.errors.map((e) => e.message).join("; ")}`
      );
    }
  }

  const updatedAt = new Date();
  Object.assign(post, {
    ...postUpdates,
    updatedAt,
  });

  await repository.save(post);

  if (syncToPostIds.length > 0) {
    const syncedPosts = await repository.find({
      where: {
        id: In(syncToPostIds),
      },
      relations: {
        postMedia: {
          media: true,
        },
        channel: true,
      },
      order: {
        postMedia: {
          order: "ASC",
        },
      },
    });

    const resolvePipelineStatus = (channelTypeId: string, requestedStatus?: Post["status"]) => {
      if (requestedStatus !== "ready" && requestedStatus !== "scheduled") return requestedStatus;
      const autoChannels: string[] = [CHANNEL_TYPES.bluesky.id, CHANNEL_TYPES.reddit.id];
      return autoChannels.includes(channelTypeId) ? "scheduled" : "ready";
    };

    await Promise.all(
      syncedPosts.map(async (syncPost) => {
        const syncStatus = resolvePipelineStatus(syncPost.channel.typeId, postUpdates.status);
        const syncUpdates =
          syncStatus ? { ...postUpdates, status: syncStatus } : { ...postUpdates };

        const shouldValidateBluesky =
          syncStatus === "scheduled" && syncPost.status !== "scheduled" && syncPost.channel.typeId === CHANNEL_TYPES.bluesky.id;

        if (shouldValidateBluesky) {
          const media = syncPost.postMedia
            .filter((pm) => pm.media !== null)
            .map((pm) => pm.media)
            .filter((m): m is NonNullable<typeof m> => m !== null);

          const validation = await validatePost(syncUpdates.caption ?? syncPost.caption, media);

          if (!validation.valid) {
            throw new Error(
              `Cannot schedule Bluesky post: ${validation.errors.map((e) => e.message).join("; ")}`
            );
          }
        }

        Object.assign(syncPost, {
          ...syncUpdates,
          updatedAt,
        });

        return repository.save(syncPost);
      })
    );
  }

  return fetchPostById(id);
};

