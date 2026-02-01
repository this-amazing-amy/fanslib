import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { validationError } from "../../lib/hono-utils";
import { fetchFanslyAnalyticsData } from "./fetch-fansly-data";
import { updateFanslyCredentialsFromFetch } from "./operations/credentials";
import { fetchFypActionItems } from "./operations/fyp/fetch-actions";
import { fetchAnalyticsHealth } from "./operations/health/fetch-health";
import { generateInsights } from "./operations/insights";
import { fetchDatapoints } from "./operations/post-analytics/fetch-datapoints";
import { getHashtagAnalytics } from "./operations/post-analytics/fetch-hashtag-analytics";
import { getFanslyPostsWithAnalytics } from "./operations/post-analytics/fetch-posts-with-analytics";
import { getTimeAnalytics } from "./operations/post-analytics/fetch-time-analytics";
import { initializeAnalyticsAggregates } from "./operations/post-analytics/initialize-aggregates";

// Zod schema conversions for request validation
const UpdateCredentialsFromFetchRequestBodySchema = z.object({
  fetchRequest: z.string(),
});

const FetchDatapointsRequestParamsSchema = z.object({
  postMediaId: z.string(),
});

const FetchAnalyticsDataRequestParamsSchema = z.object({
  postMediaId: z.string(),
});

const FetchAnalyticsDataRequestBodySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const GetFanslyPostsWithAnalyticsQuerySchema = z.object({
  sortBy: z.string().optional(),
  sortDirection: z.enum(["asc", "desc"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const FypActionsQuerySchema = z.object({
  thresholdType: z.enum(["views", "engagement"]).optional(),
  thresholdValue: z.coerce.number().optional(),
});

export const analyticsRoutes = new Hono()
  .basePath("/api/analytics")
  .post("/credentials/update-from-fetch", zValidator("json", UpdateCredentialsFromFetchRequestBodySchema, validationError), async (c) => {
    const body = c.req.valid("json");
    await updateFanslyCredentialsFromFetch(body.fetchRequest);
    return c.json({ success: true });
  })
  .get("/datapoints/:postMediaId", zValidator("param", FetchDatapointsRequestParamsSchema, validationError), async (c) => {
    const { postMediaId } = c.req.valid("param");
    const result = await fetchDatapoints(postMediaId);
    return c.json(result);
  })
  .post("/fetch/by-id/:postMediaId", 
    zValidator("param", FetchAnalyticsDataRequestParamsSchema, validationError),
    zValidator("json", FetchAnalyticsDataRequestBodySchema, validationError),
    async (c) => {
      const { postMediaId } = c.req.valid("param");
      const body = c.req.valid("json");
      const start = body.startDate ? new Date(body.startDate) : undefined;
      const end = body.endDate ? new Date(body.endDate) : undefined;
      const result = await fetchFanslyAnalyticsData(postMediaId, start, end);
      return c.json(result);
    })
  .get("/posts", zValidator("query", GetFanslyPostsWithAnalyticsQuerySchema, validationError), async (c) => {
    const query = c.req.valid("query");
    const result = await getFanslyPostsWithAnalytics(
      query.sortBy,
      query.sortDirection,
      query.startDate,
      query.endDate
    );
    return c.json(result);
  })
  .get("/hashtags", async (c) => {
    const result = await getHashtagAnalytics();
    return c.json(result);
  })
  .get("/time", async (c) => {
    const result = await getTimeAnalytics();
    return c.json(result);
  })
  .get("/insights", async (c) => {
    const posts = await getFanslyPostsWithAnalytics();
    const result = await generateInsights(posts);
    return c.json(result);
  })
  .post("/initialize-aggregates", async (c) => {
    await initializeAnalyticsAggregates();
    return c.json({ success: true });
  })
  .get("/health", async (c) => {
    const result = await fetchAnalyticsHealth();
    return c.json(result);
  })
  .get("/fyp-actions", zValidator("query", FypActionsQuerySchema, validationError), async (c) => {
    const query = c.req.valid("query");
    const result = await fetchFypActionItems(query);
    return c.json(result);
  });
