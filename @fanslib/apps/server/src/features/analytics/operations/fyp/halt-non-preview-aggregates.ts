import { db } from "../../../../lib/db";
import { Post } from "../../../posts/entity";
import { FanslyAnalyticsAggregate } from "../../entity";
import { isFypTrackable } from "./preview-heuristic";

export type HaltResult = {
  checked: number;
  halted: number;
};

export const haltNonPreviewAggregates = async (): Promise<HaltResult> => {
  const dataSource = await db();
  const aggregateRepo = dataSource.getRepository(FanslyAnalyticsAggregate);

  const activeAggregates = await aggregateRepo
    .createQueryBuilder("agg")
    .leftJoinAndSelect("agg.postMedia", "pm")
    .leftJoinAndSelect("pm.media", "media")
    .leftJoinAndSelect("pm.post", "post")
    .leftJoin("post.channel", "channel")
    .where("agg.nextFetchAt IS NOT NULL")
    .andWhere("channel.typeId = :typeId", { typeId: "fansly" })
    .getMany();

  const postIds = [...new Set(activeAggregates.map((a) => a.postMedia.post.id))];

  const posts = await Promise.all(
    postIds.map((postId) =>
      dataSource.getRepository(Post).findOne({
        where: { id: postId },
        relations: { postMedia: { media: true } },
      }),
    ),
  );

  const postMediaByPostId = new Map(
    posts
      .filter((p): p is Post => p !== null)
      .map((p) => [
        p.id,
        p.postMedia.map((pm) => ({
          id: pm.id,
          order: pm.order,
          mediaType: pm.media?.type ?? null,
          duration: pm.media?.duration ?? null,
        })),
      ]),
  );

  const toHalt = activeAggregates.filter((agg) => {
    const siblings = postMediaByPostId.get(agg.postMedia.post.id);
    if (!siblings || siblings.length <= 1) return false;
    return !isFypTrackable(agg.postMediaId, siblings);
  });

  await Promise.all(
    toHalt.map((agg) => {
      (agg as { nextFetchAt: Date | null }).nextFetchAt = null;
      return aggregateRepo.save(agg);
    }),
  );

  return { checked: activeAggregates.length, halted: toHalt.length };
};
