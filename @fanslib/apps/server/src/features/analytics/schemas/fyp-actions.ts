import { t } from "elysia";

export const FypPostSchema = t.Object({
  postId: t.String(),
  postDate: t.String(),
  mediaId: t.String(),
  totalViews: t.Number(),
  avgEngagementSeconds: t.Number(),
  percentVsAverage: t.Number(),
  plateauDaysSincePosted: t.Nullable(t.Number()),
  daysSincePosted: t.Number(),
});

export const FypActionsQuerySchema = t.Object({
  thresholdType: t.Optional(t.Union([t.Literal("views"), t.Literal("engagement")])),
  thresholdValue: t.Optional(t.Number()),
});

export const FypActionsResponseSchema = t.Object({
  userAverageViews: t.Number(),
  userAverageEngagementSeconds: t.Number(),
  activeOnFypCount: t.Number(),
  considerRemoving: t.Array(FypPostSchema),
  readyToRepost: t.Array(FypPostSchema),
});
