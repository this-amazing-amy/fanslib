import { t } from "elysia";
import { db } from "../../../../lib/db";
import { Post, PostSchema } from "../../entity";
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

  const post = await repository.findOne({ where: { id } });
  if (!post) return null;

  Object.assign(post, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });

  await repository.save(post);

  return fetchPostById(id);
};

