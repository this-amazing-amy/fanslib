import { Elysia } from "elysia";
import { fetchFanslyAnalyticsData } from "./fetch-fansly-data";
import { updateFanslyCredentialsFromFetch } from "./operations/credentials";
import { generateInsights } from "./operations/insights";
import { getHashtagAnalytics } from "./operations/post-analytics/fetch-hashtag-analytics";
import { getFanslyPostsWithAnalytics } from "./operations/post-analytics/fetch-posts-with-analytics";
import { getTimeAnalytics } from "./operations/post-analytics/fetch-time-analytics";
import { initializeAnalyticsAggregates } from "./operations/post-analytics/initialize-aggregates";

export const analyticsRoutes = new Elysia({ prefix: "/api/analytics" })
  .post("/credentials/update-from-fetch", async ({ body }) => {
    const { fetchRequest } = body as { fetchRequest: string };
    await updateFanslyCredentialsFromFetch(fetchRequest);
    return { success: true };
  })
  .post("/fetch/:postId", async ({ params: { postId }, body }) => {
    const { startDate, endDate } = body as { startDate?: string; endDate?: string };
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return fetchFanslyAnalyticsData(postId, start, end);
  })
  .get("/posts", async ({ query }) => {
    const { sortBy, sortDirection, startDate, endDate } = query;
    return getFanslyPostsWithAnalytics(
      sortBy as string,
      sortDirection as "asc" | "desc",
      startDate as string,
      endDate as string
    );
  })
  .get("/hashtags", async () => getHashtagAnalytics())
  .get("/time", async () => getTimeAnalytics())
  .get("/insights", async () => {
    const posts = await getFanslyPostsWithAnalytics();
    return generateInsights(posts);
  })
  .post("/initialize-aggregates", async () => {
    await initializeAnalyticsAggregates();
    return { success: true };
  });



