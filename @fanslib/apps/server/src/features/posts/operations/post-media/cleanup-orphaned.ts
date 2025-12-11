import { db } from "../../../../lib/db";
import { PostMedia } from "../../entity";

export const cleanupOrphanedPostMedia = async (): Promise<{
  removedCount: number;
  removedIds: string[];
}> => {
  const dataSource = await db();
  const repository = dataSource.getRepository(PostMedia);

  const orphanedPostMedia = await repository
    .createQueryBuilder("postMedia")
    .leftJoin("postMedia.post", "post")
    .where("post.id IS NULL")
    .getMany();

  if (orphanedPostMedia.length === 0) {
    return { removedCount: 0, removedIds: [] };
  }

  const removedIds = orphanedPostMedia.map((pm) => pm.id);
  await repository.remove(orphanedPostMedia);

  console.log(`🧹 Cleaned up ${orphanedPostMedia.length} orphaned PostMedia entries`);

  return { removedCount: orphanedPostMedia.length, removedIds };
};
