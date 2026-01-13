import { t } from "elysia";
import { db } from "../../../../lib/db";
import { CHANNEL_TYPES } from "../../../channels/channelTypes";
import { Post } from "../../entity";
import { PostSchema } from "../../schema";
import { validatePost } from "../../../api-bluesky/operations/validate-post";
import { fetchPostById, FetchPostByIdResponseSchema } from "./fetch-by-id";

export const UpdatePostRequestParamsSchema = t.Object({
  id: t.String(),
});

export const UpdatePostRequestBodySchema = t.Partial(PostSchema);
export const UpdatePostResponseSchema = FetchPostByIdResponseSchema;

export const updatePost = async (
  id: string,
  updates: Partial<Post>
): Promise<typeof UpdatePostResponseSchema.static | null> => {
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

  const isStatusChangeToScheduled = updates.status === "scheduled" && post.status !== "scheduled";
  const isBlueskyPost = post.channel.typeId === CHANNEL_TYPES.bluesky.id;

  if (isStatusChangeToScheduled && isBlueskyPost) {
    const media = post.postMedia
      .filter((pm) => pm.media !== null)
      .map((pm) => pm.media)
      .filter((m): m is NonNullable<typeof m> => m !== null);

    const validation = await validatePost(updates.caption ?? post.caption, media);

    if (!validation.valid) {
      throw new Error(
        `Cannot schedule Bluesky post: ${validation.errors.map((e) => e.message).join("; ")}`
      );
    }
  }

  Object.assign(post, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });

  await repository.save(post);

  return fetchPostById(id);
};

