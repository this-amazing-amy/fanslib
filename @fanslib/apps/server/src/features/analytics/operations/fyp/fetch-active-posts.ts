import type { z } from "zod";
import { db } from "../../../../lib/db";
import { Post } from "../../../posts/entity";
import type { ActiveFypPostsQuerySchema } from "../../schemas/active-fyp-posts";

type DatapointItem = {
  timestamp: number;
  views: number;
  interactionTime: number;
};

type ActiveFypPostItem = {
  postMediaId: string;
  postId: string;
  fanslyPostId: string | null;
  mediaId: string;
  caption: string | null;
  totalViews: number;
  averageEngagementPercent: number;
  averageEngagementSeconds: number;
  datapoints: DatapointItem[];
};

export const fetchActiveFypPosts = async (
  query: z.infer<typeof ActiveFypPostsQuerySchema>
): Promise<ActiveFypPostItem[]> => {
  const sortBy = query.sortBy ?? "engagementSeconds";
  const dataSource = await db();
  const postRepository = dataSource.getRepository(Post);

  const posts = await postRepository
    .createQueryBuilder("post")
    .leftJoinAndSelect("post.postMedia", "pm")
    .leftJoinAndSelect("pm.media", "media")
    .leftJoinAndSelect("pm.fanslyAnalyticsAggregate", "agg")
    .leftJoinAndSelect("pm.fanslyAnalyticsDatapoints", "dp")
    .leftJoin("post.channel", "channel")
    .where("channel.typeId = :typeId", { typeId: "fansly" })
    .andWhere("pm.fanslyStatisticsId IS NOT NULL")
    .andWhere("post.fypRemovedAt IS NULL")
    .andWhere("(post.fypManuallyRemoved = :notRemoved OR post.fypManuallyRemoved IS NULL)", {
      notRemoved: false,
    })
    .andWhere("agg.plateauDetectedAt IS NULL")
    .getMany();

  const items: ActiveFypPostItem[] = [];

  posts.forEach((post) => {
    const pm = post.postMedia[0];
    const agg = pm?.fanslyAnalyticsAggregate;
    if (!pm || !agg) return;

    const datapoints = (pm.fanslyAnalyticsDatapoints ?? [])
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((dp) => ({
        timestamp: dp.timestamp,
        views: dp.views,
        interactionTime: dp.interactionTime,
      }));

    items.push({
      postMediaId: pm.id,
      postId: post.id,
      fanslyPostId: post.fanslyPostId ?? null,
      mediaId: pm.media?.id ?? "",
      caption: post.caption,
      totalViews: agg.totalViews,
      averageEngagementPercent: agg.averageEngagementPercent,
      averageEngagementSeconds: agg.averageEngagementSeconds,
      datapoints,
    });
  });

  const sortKeyMap = {
    views: "totalViews",
    engagementPercent: "averageEngagementPercent",
    engagementSeconds: "averageEngagementSeconds",
  } as const;

  const key = sortKeyMap[sortBy];
  items.sort((a, b) => a[key] - b[key]);

  return items;
};
