import { db } from "../../../../lib/db";
import { FanslyAnalyticsAggregate } from "../../entity";

export const clearNextFetch = async (postMediaId: string) => {
  const dataSource = await db();
  const repo = dataSource.getRepository(FanslyAnalyticsAggregate);

  const result = await repo.update({ postMediaId }, { nextFetchAt: undefined });

  return { cleared: (result.affected ?? 0) > 0 };
};
