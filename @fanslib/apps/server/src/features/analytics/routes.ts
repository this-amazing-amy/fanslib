import { Elysia, t } from "elysia";
import { fetchFanslyAnalyticsData } from "./fetch-fansly-data";
import { updateFanslyCredentialsFromFetch } from "./operations/credentials";
import { GenerateInsightsResponseSchema, generateInsights } from "./operations/insights";
import { GetHashtagAnalyticsResponseSchema, getHashtagAnalytics } from "./operations/post-analytics/fetch-hashtag-analytics";
import { GetFanslyPostsWithAnalyticsQuerySchema, GetFanslyPostsWithAnalyticsResponseSchema, getFanslyPostsWithAnalytics } from "./operations/post-analytics/fetch-posts-with-analytics";
import { GetTimeAnalyticsResponseSchema, getTimeAnalytics } from "./operations/post-analytics/fetch-time-analytics";
import { initializeAnalyticsAggregates } from "./operations/post-analytics/initialize-aggregates";

const UpdateCredentialsFromFetchBodySchema = t.Object({
  fetchRequest: t.String(),
});

const FetchAnalyticsDataParamsSchema = t.Object({
  postId: t.String(),
});

const FetchAnalyticsDataBodySchema = t.Object({
  startDate: t.Optional(t.String()),
  endDate: t.Optional(t.String()),
});

export const analyticsRoutes = new Elysia({ prefix: "/api/analytics" })
  .post("/credentials/update-from-fetch", async ({ body }) => {
    await updateFanslyCredentialsFromFetch(body.fetchRequest);
    return { success: true };
  }, {
    body: UpdateCredentialsFromFetchBodySchema,
    response: t.Object({ success: t.Boolean() }),
  })
  .post("/fetch/:postId", async ({ params, body }) => {
    const start = body.startDate ? new Date(body.startDate) : undefined;
    const end = body.endDate ? new Date(body.endDate) : undefined;
    return fetchFanslyAnalyticsData(params.postId, start, end);
  }, {
    params: FetchAnalyticsDataParamsSchema,
    body: FetchAnalyticsDataBodySchema,
  })
  .get("/posts", async ({ query }) => getFanslyPostsWithAnalytics(
      query.sortBy,
      query.sortDirection,
      query.startDate,
      query.endDate
    ), {
    query: GetFanslyPostsWithAnalyticsQuerySchema,
    response: GetFanslyPostsWithAnalyticsResponseSchema,
  })
  .get("/hashtags", async () => getHashtagAnalytics(), {
    response: GetHashtagAnalyticsResponseSchema,
  })
  .get("/time", async () => getTimeAnalytics(), {
    response: GetTimeAnalyticsResponseSchema,
  })
  .get("/insights", async () => {
    const posts = await getFanslyPostsWithAnalytics();
    return generateInsights(posts);
  }, {
    response: GenerateInsightsResponseSchema,
  })
  .post("/initialize-aggregates", async () => {
    await initializeAnalyticsAggregates();
    return { success: true };
  }, {
    response: t.Object({ success: t.Boolean() }),
  });



