import { t } from "elysia";
import { In } from "typeorm";
import { db } from "../../../../lib/db";
import { Media } from "../../../library/entity";
import type { Post } from "../../entity";
import { PostMedia } from "../../entity";
import { getPostById, GetPostByIdResponseSchema } from "../post/fetch-by-id";

export const AddMediaToPostRequestParamsSchema = t.Object({
  id: t.String(),
});

export const AddMediaToPostRequestBodySchema = t.Object({
  mediaIds: t.Array(t.String()),
});

export const AddMediaToPostResponseSchema = GetPostByIdResponseSchema;

export const addMediaToPost = async (
  postId: string,
  mediaIds: string[]
): Promise<typeof AddMediaToPostResponseSchema.static> => {
  const dataSource = await db();
  const postMediaRepo = dataSource.getRepository(PostMedia);
  const mediaRepo = dataSource.getRepository(Media);

  const post = await getPostById(postId);
  if (!post) return null;

  const existingCount = !("error" in post) ? post.postMedia?.length ?? 0 : 0;

  const media = await mediaRepo.findBy({ id: In(mediaIds) });
  const postMedia = media.map((m, index) =>
    postMediaRepo.create({
      post: { id: postId } as Post,
      media: m,
      order: existingCount + index,
    })
  );

  await postMediaRepo.save(postMedia);

  return getPostById(postId);
};

