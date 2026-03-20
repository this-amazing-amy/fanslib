import type { z } from "zod";
import { db } from "../../../../lib/db";
import { Post } from "../../../posts/entity";
import type { ActiveFypPostsQuerySchema } from "../../schemas/active-fyp-posts";

type ActiveFypPostItem = {
  postMediaId: string;
  postId: string;
  mediaId: string;
  caption: string | null;
  totalViews: number;
  averageEngagementPercent: number;
  averageEngagementSeconds: number;
};

export const fetchActiveFypPosts = async (
  query: z.infer<typeof ActiveFypPostsQuerySchema>
): Promise<ActiveFypPostItem[]> => {
  const sortBy = query.sortBy ?? "views";
  const dataSource = await db();
  const postRepository = dataSource.getRepository(Post);

  const posts = await postRepository
    .createQueryBuilder("post")
    .leftJoinAndSelect("post.postMedia", "pm")
    .leftJoinAndSelect("pm.media", "media")
    .leftJoinAndSelect("pm.fanslyAnalyticsAggregate", "agg")
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

    items.push({
      postMediaId: pm.id,
      postId: post.id,
      mediaId: pm.media?.id ?? "",
      caption: post.caption,
      totalViews: agg.totalViews,
      averageEngagementPercent: agg.averageEngagementPercent,
      averageEngagementSeconds: agg.averageEngagementSeconds,
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
