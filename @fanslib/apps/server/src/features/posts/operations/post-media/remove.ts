import { In } from "typeorm";
import { db } from "../../../../lib/db";
import type { Post } from "../../entity";
import { PostMedia } from "../../entity";
import { getPostById } from "../post/fetch-by-id";

export const removeMediaFromPost = async (
  postId: string,
  mediaIds: string[]
): Promise<Post | null> => {
  const dataSource = await db();
  const postMediaRepo = dataSource.getRepository(PostMedia);

  await postMediaRepo.delete({
    post: { id: postId },
    media: { id: In(mediaIds) },
  });

  return getPostById(postId);
};

