import { db } from "../../../../lib/db";
import { FanslyAnalyticsAggregate } from "../../entity";

type QueueItem = {
  postMediaId: string;
  nextFetchAt: string;
  caption: string | null;
  thumbnailUrl: string;
  overdue: boolean;
};

type QueueState = {
  totalPending: number;
  nextFetchAt: string | null;
  items: QueueItem[];
};

export const fetchQueueState = async (): Promise<QueueState> => {
  const dataSource = await db();
  const repo = dataSource.getRepository(FanslyAnalyticsAggregate);

  const aggregates = await repo
    .createQueryBuilder("agg")
    .leftJoinAndSelect("agg.postMedia", "pm")
    .leftJoinAndSelect("pm.post", "post")
    .leftJoinAndSelect("pm.media", "media")
    .where("agg.nextFetchAt IS NOT NULL")
    .orderBy("agg.nextFetchAt", "ASC")
    .getMany();

  const now = new Date();

  const items: QueueItem[] = aggregates
    .filter((agg) => agg.nextFetchAt != null)
    .map((agg) => {
      const nextFetchAt = agg.nextFetchAt as Date;
      return {
        postMediaId: agg.postMediaId,
        nextFetchAt: nextFetchAt.toISOString(),
        caption: agg.postMedia?.post?.caption ?? null,
        thumbnailUrl: `thumbnail://${agg.postMedia?.media?.id ?? ""}`,
        overdue: nextFetchAt <= now,
      };
    });

  return {
    totalPending: items.length,
    nextFetchAt: items.length > 0 ? items[0].nextFetchAt : null,
    items,
  };
};
