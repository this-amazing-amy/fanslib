import { t } from "elysia";
import { db } from "../../../../lib/db";
import { Post } from "../../../posts/entity";
import { FanslyPostWithAnalyticsSchema } from "../../schemas/analytics";

export const GetFanslyPostsWithAnalyticsQuerySchema = t.Object({
  sortBy: t.Optional(t.String()),
  sortDirection: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
  startDate: t.Optional(t.String()),
  endDate: t.Optional(t.String()),
});

export const GetFanslyPostsWithAnalyticsResponseSchema = t.Array(FanslyPostWithAnalyticsSchema);

export const getFanslyPostsWithAnalytics = async (
  sortBy = "date",
  sortDirection: "asc" | "desc" = "desc",
  startDate?: string,
  endDate?: string
): Promise<typeof GetFanslyPostsWithAnalyticsResponseSchema.static> => {
  const dataSource = await db();
  const postRepository = dataSource.getRepository(Post);

  const queryBuilder = postRepository
    .createQueryBuilder("post")
    .leftJoinAndSelect("post.channel", "channel")
    .leftJoinAndSelect("post.postMedia", "postMedia")
    .leftJoinAndSelect("postMedia.media", "media")
    .leftJoinAndSelect("postMedia.fanslyAnalyticsAggregate", "analytics")
    .where("channel.typeId = :typeId", { typeId: "fansly" });

  if (startDate) {
    queryBuilder.andWhere("post.date >= :startDate", { startDate });
  }
  if (endDate) {
    queryBuilder.andWhere("post.date <= :endDate", { endDate });
  }

  const sortMap: Record<string, string> = {
    date: "post.date",
    views: "analytics.totalViews",
    engagement: "analytics.averageEngagementSeconds",
    engagementPercent: "analytics.averageEngagementPercent",
    videoLength: "media.duration",
  };

  const sortColumn = sortMap[sortBy] ?? "post.date";
  queryBuilder.orderBy(sortColumn, sortDirection === "asc" ? "ASC" : "DESC");

  const posts = await queryBuilder.getMany();

  return posts.map((post) => {
    const primaryMedia = post.postMedia[0];
    const primaryAnalytics = primaryMedia?.fanslyAnalyticsAggregate;
    const statisticsUrl = primaryMedia?.fanslyStatisticsId
      ? `https://fansly.com/statistics/${primaryMedia.fanslyStatisticsId}`
      : "";

    return {
      id: post.id,
      date: post.date,
      caption: post.caption ?? "",
      thumbnailUrl: primaryMedia?.media ? `thumbnail://${primaryMedia.media.id}` : "",
      postUrl: post.url ?? "",
      statisticsUrl,
      totalViews: primaryAnalytics?.totalViews ?? 0,
      averageEngagementSeconds: primaryAnalytics?.averageEngagementSeconds ?? 0,
      averageEngagementPercent: primaryAnalytics?.averageEngagementPercent ?? 0,
      hashtags: post.caption?.match(/#\w+/g) ?? [],
      videoLength: primaryMedia?.media?.duration ?? 0,
      media: primaryMedia?.media,
    };
  });
};

