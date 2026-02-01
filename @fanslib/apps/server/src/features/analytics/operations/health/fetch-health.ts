import { MoreThanOrEqual } from "typeorm";
import { db } from "../../../../lib/db";
import { PostMedia } from "../../../posts/entity";
import { FanslyAnalyticsDatapoint } from "../../entity";
import { FanslyMediaCandidate } from "../../candidate-entity";

const STALE_THRESHOLD_MS = 3 * 24 * 60 * 60 * 1000;

export const fetchAnalyticsHealth = async () => {
  const dataSource = await db();
  const postMediaRepository = dataSource.getRepository(PostMedia);
  const candidateRepository = dataSource.getRepository(FanslyMediaCandidate);

  const postMediaList = await postMediaRepository
    .createQueryBuilder("pm")
    .leftJoin("pm.post", "post")
    .leftJoin("post.channel", "channel")
    .leftJoin("pm.media", "media")
    .leftJoin(
      (qb) =>
        qb
          .select("dp.postMediaId", "postMediaId")
          .addSelect("MAX(dp.timestamp)", "latestTimestamp")
          .from(FanslyAnalyticsDatapoint, "dp")
          .groupBy("dp.postMediaId"),
      "latestDp",
      "latestDp.postMediaId = pm.id"
    )
    .where("channel.typeId = :typeId", { typeId: "fansly" })
    .select([
      "pm.id",
      "pm.fanslyStatisticsId",
      "post.date",
      "media.name",
      "media.id",
    ])
    .addSelect("latestDp.latestTimestamp", "lastDatapoint")
    .getRawMany();

  const now = Date.now();
  const totalCount = postMediaList.length;
  const matched = postMediaList.filter((pm) => pm.pm_fanslyStatisticsId);
  const matchedCount = matched.length;
  const unmatchedCount = totalCount - matchedCount;
  const coveragePercent =
    totalCount > 0 ? (matchedCount / totalCount) * 100 : 0;

  const stale = matched.filter(
    (pm) => pm.lastDatapoint && now - pm.lastDatapoint > STALE_THRESHOLD_MS
  );

  const pendingMatches = await candidateRepository.count({
    where: { status: "pending" },
  });

  const highConfidenceMatches = await candidateRepository.count({
    where: {
      status: "pending",
      matchConfidence: MoreThanOrEqual(0.95),
    },
  });

  const stalePosts = stale.map((pm) => ({
    postMediaId: pm.pm_id,
    postDate: pm.post_date,
    mediaName: pm.media_name,
    mediaId: pm.media_id,
    daysSinceUpdate: Math.floor(
      (now - pm.lastDatapoint) / (24 * 60 * 60 * 1000)
    ),
  }));

  return {
    coveragePercent,
    totalCount,
    matchedCount,
    pendingMatches,
    highConfidenceMatches,
    staleCount: stale.length,
    unmatchedCount,
    stalePosts,
  };
};
