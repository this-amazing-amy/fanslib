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
    .leftJoinAndSelect("post.fanslyAnalyticsAggregate", "analytics")
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

  return posts.map((post) => ({
    id: post.id,
    date: post.date,
    caption: post.caption ?? "",
    thumbnailUrl: post.postMedia[0]?.media ? `thumbnail://${post.postMedia[0].media.id}` : "",
    postUrl: post.url ?? "",
    statisticsUrl: post.fanslyStatisticsId
      ? `https://fansly.com/statistics/${post.fanslyStatisticsId}`
      : "",
    totalViews: post.fanslyAnalyticsAggregate?.totalViews ?? 0,
    averageEngagementSeconds: post.fanslyAnalyticsAggregate?.averageEngagementSeconds ?? 0,
    averageEngagementPercent: post.fanslyAnalyticsAggregate?.averageEngagementPercent ?? 0,
    hashtags: post.caption?.match(/#\w+/g) ?? [],
    videoLength: post.postMedia[0]?.media?.duration ?? 0,
    media: post.postMedia[0]?.media,
  }));
};

