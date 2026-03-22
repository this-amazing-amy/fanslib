import { In } from "typeorm";
import { db } from "../../../../lib/db";
import { FanslyAnalyticsAggregate } from "../../../analytics/entity";
import { Post, PostMedia } from "../../entity";

export const deletePost = async (id: string): Promise<boolean> => {
  const dataSource = await db();
  const postRepo = dataSource.getRepository(Post);
  const postMediaRepo = dataSource.getRepository(PostMedia);
  const aggregateRepo = dataSource.getRepository(FanslyAnalyticsAggregate);

  const post = await postRepo.findOne({
    where: { id },
    relations: ["postMedia"],
  });
  if (!post) {
    return false;
  }

  // Explicitly delete analytics aggregates and PostMedia before the post,
  // rather than relying on DB-level FK cascades which may not fire in SQLite
  // without PRAGMA foreign_keys = ON.
  const postMediaIds = post.postMedia.map((pm) => pm.id);
  if (postMediaIds.length > 0) {
    await aggregateRepo.delete({ postMediaId: In(postMediaIds) });
    await postMediaRepo.delete({ id: In(postMediaIds) });
  }

  await postRepo.delete({ id });
  return true;
};
