import { z } from "zod";
import { In } from "typeorm";
import { db } from "../../../../lib/db";
import { PostMedia } from "../../entity";
import type { PostWithRelations } from "../post/fetch-by-id";
import { fetchPostById } from "../post/fetch-by-id";

export const RemoveMediaFromPostRequestBodySchema = z.object({
  mediaIds: z.array(z.string()),
});

export const removeMediaFromPost = async (
  postId: string,
  mediaIds: string[]
): Promise<PostWithRelations | null> => {
  const dataSource = await db();
  const postMediaRepo = dataSource.getRepository(PostMedia);

  await postMediaRepo.delete({
    post: { id: postId },
    media: { id: In(mediaIds) },
  });

  return fetchPostById(postId);
};

