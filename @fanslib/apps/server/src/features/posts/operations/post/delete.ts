import { db } from "../../../../lib/db";
import { Post } from "../../entity";

export const deletePost = async (id: string): Promise<boolean> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(Post);
  const post = await repository.findOne({ where: { id } });
  if (!post) {
    return false;
  }
  await repository.delete({ id });
  return true;
};

