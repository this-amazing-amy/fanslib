import { t } from "elysia";

export const StalePostSchema = t.Object({
  postMediaId: t.String(),
  postDate: t.String(),
  mediaName: t.String(),
  mediaId: t.String(),
  daysSinceUpdate: t.Number(),
});

export const AnalyticsHealthResponseSchema = t.Object({
  coveragePercent: t.Number(),
  totalCount: t.Number(),
  matchedCount: t.Number(),
  pendingMatches: t.Number(),
  highConfidenceMatches: t.Number(),
  staleCount: t.Number(),
  unmatchedCount: t.Number(),
  stalePosts: t.Array(StalePostSchema),
});
