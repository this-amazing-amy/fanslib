import { db } from "../../../../lib/db";
import { Post } from "../../entity";

export const deletePost = async (id: string): Promise<void> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Post);
  await repository.delete({ id });
};

