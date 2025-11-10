import { t } from "elysia";
import { In } from "typeorm";
import { db } from "../../../../lib/db";
import { PostMedia } from "../../entity";
import { getPostById, GetPostByIdResponseSchema } from "../post/fetch-by-id";

export const RemoveMediaFromPostRequestParamsSchema = t.Object({
  id: t.String(),
});

export const RemoveMediaFromPostRequestBodySchema = t.Object({
  mediaIds: t.Array(t.String()),
});

export const RemoveMediaFromPostResponseSchema = GetPostByIdResponseSchema;

export const removeMediaFromPost = async (
  postId: string,
  mediaIds: string[]
): Promise<typeof RemoveMediaFromPostResponseSchema.static> => {
  const dataSource = await db();
  const postMediaRepo = dataSource.getRepository(PostMedia);

  await postMediaRepo.delete({
    post: { id: postId },
    media: { id: In(mediaIds) },
  });

  return getPostById(postId);
};

