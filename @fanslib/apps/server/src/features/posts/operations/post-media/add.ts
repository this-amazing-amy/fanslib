import { z } from "zod";
import { In } from "typeorm";
import { db } from "../../../../lib/db";
import { Media } from "../../../library/entity";
import type { Post } from "../../entity";
import { PostMedia } from "../../entity";
import type { PostWithRelations } from "../post/fetch-by-id";
import { fetchPostById } from "../post/fetch-by-id";

export const AddMediaToPostRequestBodySchema = z.object({
  mediaIds: z.array(z.string()),
});

export const addMediaToPost = async (
  postId: string,
  mediaIds: string[]
): Promise<PostWithRelations | null> => {
  const dataSource = await db();
  const postMediaRepo = dataSource.getRepository(PostMedia);
  const mediaRepo = dataSource.getRepository(Media);

  const post = await fetchPostById(postId);
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

  return fetchPostById(postId);
};

