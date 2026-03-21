import type { z } from "zod";
import { db } from "../../../../lib/db";
import { PostMedia } from "../../../posts/entity";
import type { RepostCandidatesQuerySchema } from "../../schemas/repost-candidates";

type RepostCandidateItem = {
  mediaId: string;
  caption: string | null;
  totalViews: number;
  averageEngagementPercent: number;
  averageEngagementSeconds: number;
  timesPosted: number;
};

const isActiveOnFyp = (pm: PostMedia): boolean => {
  const agg = pm.fanslyAnalyticsAggregate;
  const post = pm.post;
  if (!agg) return false;
  const isPlateaued = agg.plateauDetectedAt !== null && agg.plateauDetectedAt !== undefined;
  const isRemoved = post.fypRemovedAt !== null || post.fypManuallyRemoved === true;
  return !isPlateaued && !isRemoved;
};

const hasNaturalPlateau = (pm: PostMedia): boolean => {
  const agg = pm.fanslyAnalyticsAggregate;
  return agg?.plateauDetectedAt !== null && agg?.plateauDetectedAt !== undefined;
};

const computeBestStats = (postMediaList: PostMedia[]) => {
  const withAggs = postMediaList
    .map((pm) => ({ pm, agg: pm.fanslyAnalyticsAggregate }))
    .filter((x): x is { pm: PostMedia; agg: NonNullable<PostMedia["fanslyAnalyticsAggregate"]> } => x.agg != null);

  const bestViews = Math.max(...withAggs.map((x) => x.agg.totalViews));
  const bestEngagementPercent = Math.max(...withAggs.map((x) => x.agg.averageEngagementPercent));
  const bestEngagementSeconds = Math.max(...withAggs.map((x) => x.agg.averageEngagementSeconds));

  const bestPerformer = withAggs.reduce((best, x) =>
    x.agg.totalViews > best.agg.totalViews ? x : best
  );

  return {
    totalViews: bestViews,
    averageEngagementPercent: bestEngagementPercent,
    averageEngagementSeconds: bestEngagementSeconds,
    caption: bestPerformer.pm.post.caption,
  };
};

const groupByMediaId = (postMediaList: PostMedia[]): Map<string, PostMedia[]> =>
  postMediaList.reduce((acc, pm) => {
    const mediaId = pm.media?.id;
    if (!mediaId) return acc;
    const group = acc.get(mediaId) ?? [];
    acc.set(mediaId, [...group, pm]);
    return acc;
  }, new Map<string, PostMedia[]>());

export const fetchRepostCandidates = async (
  query: z.infer<typeof RepostCandidatesQuerySchema>
): Promise<RepostCandidateItem[]> => {
  const sortBy = query.sortBy ?? "views";
  const dataSource = await db();
  const postMediaRepo = dataSource.getRepository(PostMedia);

  // Find all PostMedia with Fansly analytics on Fansly channels
  const allPostMedia = await postMediaRepo
    .createQueryBuilder("pm")
    .leftJoinAndSelect("pm.media", "media")
    .leftJoinAndSelect("pm.post", "post")
    .leftJoinAndSelect("pm.fanslyAnalyticsAggregate", "agg")
    .leftJoin("post.channel", "channel")
    .where("channel.typeId = :typeId", { typeId: "fansly" })
    .andWhere("pm.fanslyStatisticsId IS NOT NULL")
    .orderBy("post.date", "DESC")
    .getMany();

  const byMedia = groupByMediaId(allPostMedia);

  const candidates = Array.from(byMedia.entries())
    .filter(([, postMediaList]) => {
      // None can be currently active on FYP
      if (postMediaList.some(isActiveOnFyp)) return false;

      // The most recent PostMedia must NOT have been manually removed
      // PostMedia are already sorted by post.date DESC, so index 0 is most recent
      const mostRecent = postMediaList[0];
      if (mostRecent.post.fypManuallyRemoved === true) return false;

      // At least one must have plateaued naturally
      if (!postMediaList.some(hasNaturalPlateau)) return false;

      return true;
    })
    .map(([mediaId, postMediaList]): RepostCandidateItem => ({
      mediaId,
      ...computeBestStats(postMediaList),
      timesPosted: postMediaList.length,
    }));

  // Sort best-to-worst (descending)
  const sortKeyMap = {
    views: "totalViews",
    engagementPercent: "averageEngagementPercent",
    engagementSeconds: "averageEngagementSeconds",
  } as const;

  const key = sortKeyMap[sortBy];
  return candidates.sort((a, b) => b[key] - a[key]);
};
