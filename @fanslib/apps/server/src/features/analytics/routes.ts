import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { ActiveFypPostsQuerySchema } from "./schemas/active-fyp-posts";
import { RepostCandidatesQuerySchema } from "./schemas/repost-candidates";
import { validationError } from "../../lib/hono-utils";
import { fetchFanslyAnalyticsData } from "./fetch-fansly-data";
import { fetchActiveFypPosts } from "./operations/fyp/fetch-active-posts";
import { fetchRepostCandidates } from "./operations/fyp/fetch-repost-candidates";
import { fetchFypActionItems } from "./operations/fyp/fetch-actions";
import { haltNonPreviewAggregates } from "./operations/fyp/halt-non-preview-aggregates";
import { fetchAnalyticsHealth } from "./operations/health/fetch-health";
import { clearNextFetch } from "./operations/queue/clear-next-fetch";
import { fetchQueueState } from "./operations/queue/fetch-queue-state";
import { fetchDatapoints } from "./operations/post-analytics/fetch-datapoints";
import { getFanslyPostsWithAnalytics } from "./operations/post-analytics/fetch-posts-with-analytics";
import { initializeAnalyticsAggregates } from "./operations/post-analytics/initialize-aggregates";
import { dismissUnlinkedPost, fetchUnlinkedPosts } from "./operations/unlinked-posts";
import { linkPost } from "./operations/link-post";

// Zod schema conversions for request validation
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
  .get(
    "/datapoints/:postMediaId",
    zValidator("param", FetchDatapointsRequestParamsSchema, validationError),
    async (c) => {
      const { postMediaId } = c.req.valid("param");
      const result = await fetchDatapoints(postMediaId);
      return c.json(result);
    },
  )
  .post(
    "/fetch/by-id/:postMediaId",
    zValidator("param", FetchAnalyticsDataRequestParamsSchema, validationError),
    zValidator("json", FetchAnalyticsDataRequestBodySchema, validationError),
    async (c) => {
      const { postMediaId } = c.req.valid("param");
      const body = c.req.valid("json");
      const start = body.startDate ? new Date(body.startDate) : undefined;
      const end = body.endDate ? new Date(body.endDate) : undefined;
      const result = await fetchFanslyAnalyticsData(postMediaId, start, end);
      return c.json(result);
    },
  )
  .get(
    "/posts",
    zValidator("query", GetFanslyPostsWithAnalyticsQuerySchema, validationError),
    async (c) => {
      const query = c.req.valid("query");
      const result = await getFanslyPostsWithAnalytics(
        query.sortBy,
        query.sortDirection,
        query.startDate,
        query.endDate,
      );
      return c.json(result);
    },
  )
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
  })
  .get("/queue", async (c) => {
    const result = await fetchQueueState();
    return c.json(result);
  })
  .delete(
    "/queue/:postMediaId",
    zValidator("param", z.object({ postMediaId: z.string() }), validationError),
    async (c) => {
      const { postMediaId } = c.req.valid("param");
      const result = await clearNextFetch(postMediaId);
      return c.json(result);
    },
  )
  .get("/active-fyp-posts", zValidator("query", ActiveFypPostsQuerySchema, validationError), async (c) => {
    const query = c.req.valid("query");
    const result = await fetchActiveFypPosts(query);
    return c.json(result);
  })
  .get("/repost-candidates", zValidator("query", RepostCandidatesQuerySchema, validationError), async (c) => {
    const query = c.req.valid("query");
    const result = await fetchRepostCandidates(query);
    return c.json(result);
  })
  .post("/halt-non-preview-aggregates", async (c) => {
    const result = await haltNonPreviewAggregates();
    return c.json(result);
  })
  .get("/unlinked-posts", async (c) => {
    const result = await fetchUnlinkedPosts();
    return c.json(result);
  })
  .post("/unlinked-posts/:postMediaId/dismiss", async (c) => {
    const postMediaId = c.req.param("postMediaId");
    const result = await dismissUnlinkedPost(postMediaId);
    if (result === "not_found") return c.json({ error: "PostMedia not found" }, 404);
    return c.json({ success: true });
  .post("/link-post", async (c) => {
    const body = await c.req.json();
    const { postId, attachments } = body as {
      postId: string;
      attachments: { fanslyStatisticsId: string; duration: number }[];
    };
    const result = await linkPost(postId, attachments);
    if (result === "not_found") return c.json({ error: "Post not found" }, 404);
    if (result === "no_match") return c.json({ error: "No duration match found" }, 422);
    return c.json(result);
  });
