import { db } from "../../../../lib/db";
import type { FanslyAnalyticsResponse } from "../../../../lib/fansly-analytics/fansly-analytics-response";
import { Hashtag, HashtagChannelStats } from "../../entity";

type TagData = {
  id: string;
  tag: string;
  viewCount: number;
};

export const saveHashtagsFromAnalytics = async (
  channelId: string,
  response: FanslyAnalyticsResponse
): Promise<HashtagChannelStats[]> => {
  const dataSource = await db();
  const hashtagRepo = dataSource.getRepository(Hashtag);
  const statsRepo = dataSource.getRepository(HashtagChannelStats);

  if (
    !response.response.aggregationData?.tags ||
    !Array.isArray(response.response.aggregationData.tags)
  ) {
    return [];
  }

  const tags: TagData[] = response.response.aggregationData.tags.filter(
    (tag) => tag && typeof tag.tag === "string" && tag.tag.trim() !== "" && tag.viewCount > 0
  );

  const savedStats = (
    await Promise.all(
      tags.map(async (tagData) => {
        // eslint-disable-next-line functional/no-let
        let hashtag = await hashtagRepo.findOne({
          where: { name: tagData.tag },
          relations: ["channelStats"],
        });

        if (!hashtag) {
          hashtag = hashtagRepo.create({ name: tagData.tag });
          hashtag = await hashtagRepo.save(hashtag);
        }

        const existingStats = await statsRepo.findOne({
          where: {
            hashtagId: hashtag.id,
            channelId,
          },
        });
        if (existingStats) {
          existingStats.views = tagData.viewCount;
          return statsRepo.save(existingStats);
        }

        const newStats = statsRepo.create({
          hashtag,
          hashtagId: hashtag.id,
          channelId,
          views: tagData.viewCount,
        });
        return statsRepo.save(newStats);
      })
    )
  ).filter(Boolean);

  return savedStats;
};

