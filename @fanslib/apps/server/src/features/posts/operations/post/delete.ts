import { t } from "elysia";
import { db } from "../../../../lib/db";
import { Post } from "../../entity";

export const DeletePostRequestParamsSchema = t.Object({
  id: t.String(),
});

export const DeletePostResponseSchema = t.Object({
  success: t.Boolean(),
});

export const deletePost = async (id: string): Promise<typeof DeletePostResponseSchema.static> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Post);
  await repository.delete({ id });
  return { success: true };
};

