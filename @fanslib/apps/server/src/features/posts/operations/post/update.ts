import type { Post as PostType } from "@fanslib/types";
import { db } from "../../../../lib/db";
import { Post } from "../../entity";
import { getPostById } from "./fetch-by-id";

export const updatePost = async (
  id: string,
  updates: Partial<PostType>
): Promise<Post | null> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Post);

  const post = await repository.findOne({ where: { id } });
  if (!post) return null;

  Object.assign(post, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });

  await repository.save(post);

  return getPostById(id);
};

