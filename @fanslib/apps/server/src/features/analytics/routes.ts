import { Elysia, t } from "elysia";
import { candidatesRoutes } from "./candidates/routes";
import { FetchAnalyticsDataRequestBodySchema, FetchAnalyticsDataRequestParamsSchema, fetchFanslyAnalyticsData } from "./fetch-fansly-data";
import { UpdateCredentialsFromFetchRequestBodySchema, updateFanslyCredentialsFromFetch } from "./operations/credentials";
import { GenerateInsightsResponseSchema, generateInsights } from "./operations/insights";
import { FetchDatapointsRequestParamsSchema, FetchDatapointsResponseSchema, fetchDatapoints } from "./operations/post-analytics/fetch-datapoints";
import { GetHashtagAnalyticsResponseSchema, getHashtagAnalytics } from "./operations/post-analytics/fetch-hashtag-analytics";
import { GetFanslyPostsWithAnalyticsQuerySchema, GetFanslyPostsWithAnalyticsResponseSchema, getFanslyPostsWithAnalytics } from "./operations/post-analytics/fetch-posts-with-analytics";
import { GetTimeAnalyticsResponseSchema, getTimeAnalytics } from "./operations/post-analytics/fetch-time-analytics";
import { initializeAnalyticsAggregates } from "./operations/post-analytics/initialize-aggregates";

export const analyticsRoutes = new Elysia({ prefix: "/api/analytics" })
  .post("/credentials/update-from-fetch", async ({ body }) => {
    await updateFanslyCredentialsFromFetch(body.fetchRequest);
    return { success: true };
  }, {
    body: UpdateCredentialsFromFetchRequestBodySchema,
    response: t.Object({ success: t.Boolean() }),
  })
  .get("/datapoints/:postMediaId", async ({ params: { postMediaId } }) => {
    return fetchDatapoints(postMediaId);
  }, {
    params: FetchDatapointsRequestParamsSchema,
    response: FetchDatapointsResponseSchema,
  })
  .post("/fetch/by-id/:postMediaId", async ({ params: { postMediaId }, body }) => {
    const start = body.startDate ? new Date(body.startDate) : undefined;
    const end = body.endDate ? new Date(body.endDate) : undefined;
    return fetchFanslyAnalyticsData(postMediaId, start, end);
  }, {
    params: FetchAnalyticsDataRequestParamsSchema,
    body: FetchAnalyticsDataRequestBodySchema,
    response: t.Object({
      success: t.Boolean(),
      postMediaId: t.String(),
      datapoints: t.Number(),
    }),
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
  })
  .use(candidatesRoutes);



