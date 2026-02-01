import { t } from "elysia";

// FanslyPostWithAnalytics
export const FanslyPostWithAnalyticsSchema = t.Object({
  id: t.String(),
  date: t.Date(),
  caption: t.String(),
  thumbnailUrl: t.String(),
  postUrl: t.Optional(t.String()),
  statisticsUrl: t.Optional(t.String()),
  totalViews: t.Number(),
  averageEngagementSeconds: t.Number(),
  averageEngagementPercent: t.Number(),
  hashtags: t.Array(t.String()),
  videoLength: t.Number(),
  media: t.Optional(t.Object({
    id: t.String(),
    relativePath: t.String(),
    type: t.Union([t.Literal("image"), t.Literal("video")]),
    name: t.String(),
    size: t.Number(),
    duration: t.Nullable(t.Number()),
    redgifsUrl: t.Nullable(t.String()),
    createdAt: t.Date(),
    updatedAt: t.Date(),
    fileCreationDate: t.Date(),
    fileModificationDate: t.Date(),
  })),
});

// HashtagAnalytics - single item schema
export const HashtagAnalyticsItemSchema = t.Object({
  hashtag: t.String(),
  postCount: t.Number(),
  avgViews: t.Number(),
  avgEngagement: t.Number(),
});

export const HashtagAnalyticsSchema = t.Array(HashtagAnalyticsItemSchema);

// TimeAnalytics - single item schema
export const TimeAnalyticsItemSchema = t.Object({
  timePeriod: t.String(),
  postCount: t.Number(),
  avgViews: t.Number(),
  avgEngagement: t.Number(),
});

export const TimeAnalyticsSchema = t.Array(TimeAnalyticsItemSchema);
