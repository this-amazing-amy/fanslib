import { afterAll, beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import { Hono } from "hono";
import "reflect-metadata";
import { devalueMiddleware } from "../../lib/devalue-middleware";
import { isAppError } from "../../lib/errors";
import { getTestDataSource, setupTestDatabase, teardownTestDatabase } from "../../lib/test-db";
import { resetAllFixtures } from "../../lib/test-fixtures";
import { createTestChannel, createTestMedia, createTestPost, parseResponse } from "../../test-utils/setup";
import { saveFanslyCredentials } from "../settings/operations/credentials/save";
import { loadFanslyCredentials } from "../settings/operations/credentials/load";
import { PostMedia } from "../posts/entity";
import { FanslyAnalyticsAggregate, FanslyAnalyticsDatapoint } from "./entity";
import { fetchFanslyAnalyticsData } from "./fetch-fansly-data";
import { initializeAnalyticsAggregates } from "./operations/post-analytics/initialize-aggregates";
import { analyticsRoutes } from "./routes";

describe("Analytics Routes", () => {
  // eslint-disable-next-line functional/no-let
  let app: Hono;

  beforeAll(async () => {
    await setupTestDatabase();
    await resetAllFixtures();
    app = new Hono().use("*", devalueMiddleware()).route("/", analyticsRoutes);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await resetAllFixtures();
  });

  describe("removed endpoints", () => {
    test("GET /api/analytics/hashtags does not exist", async () => {
      const res = await app.request("/api/analytics/hashtags");
      expect(res.status).toBe(404);
    });

    test("GET /api/analytics/time does not exist", async () => {
      const res = await app.request("/api/analytics/time");
      expect(res.status).toBe(404);
    });

    test("GET /api/analytics/insights does not exist", async () => {
      const res = await app.request("/api/analytics/insights");
      expect(res.status).toBe(404);
    });

    test("POST /api/analytics/credentials/update-from-fetch does not exist", async () => {
      const res = await app.request("/api/analytics/credentials/update-from-fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fetchRequest: "test" }),
      });
      expect(res.status).toBe(404);
    });
  });

  describe("FanslyAnalyticsAggregate entity schema", () => {
    test("aggregate saves and loads plateauDetectedAt and nextFetchAt", async () => {
      const dataSource = getTestDataSource();
      const aggregateRepo = dataSource.getRepository(FanslyAnalyticsAggregate);
      const postMediaRepo = dataSource.getRepository(PostMedia);

      const post = await createTestPost();
      const media = await createTestMedia();

      const postMedia = postMediaRepo.create({ post, media, order: 0 });
      await postMediaRepo.save(postMedia);

      const now = new Date();
      const nextFetch = new Date(now.getTime() + 60 * 60 * 1000);

      const aggregate = aggregateRepo.create({
        postMedia,
        postMediaId: postMedia.id,
        totalViews: 100,
        averageEngagementSeconds: 30,
        averageEngagementPercent: 50,
        plateauDetectedAt: now,
        nextFetchAt: nextFetch,
      });
      await aggregateRepo.save(aggregate);

      const loaded = await aggregateRepo.findOne({ where: { postMediaId: postMedia.id } });
      if (!loaded) throw new Error("aggregate not found");
      expect(loaded.plateauDetectedAt).toBeInstanceOf(Date);
      expect(loaded.nextFetchAt).toBeInstanceOf(Date);
    });

    test("aggregate entity type does not have fypPerformanceScore or fypMetrics", async () => {
      const dataSource = getTestDataSource();
      const aggregateRepo = dataSource.getRepository(FanslyAnalyticsAggregate);
      const postMediaRepo = dataSource.getRepository(PostMedia);

      const post = await createTestPost();
      const media = await createTestMedia();

      const postMedia = postMediaRepo.create({ post, media, order: 0 });
      await postMediaRepo.save(postMedia);

      const aggregate = aggregateRepo.create({
        postMedia,
        postMediaId: postMedia.id,
        totalViews: 50,
        averageEngagementSeconds: 20,
        averageEngagementPercent: 40,
      });
      await aggregateRepo.save(aggregate);

      const loaded = await aggregateRepo.findOne({ where: { postMediaId: postMedia.id } });
      if (!loaded) throw new Error("aggregate not found");
      expect("fypPerformanceScore" in loaded).toBe(false);
      expect("fypMetrics" in loaded).toBe(false);
    });
  });

  describe("fetchFanslyAnalyticsData — credential staleness on 401/403", () => {
    test("marks credentials as stale when Fansly API returns 401", async () => {
      const dataSource = getTestDataSource();
      const postMediaRepo = dataSource.getRepository(PostMedia);

      // Set up credentials
      await saveFanslyCredentials({ fanslyAuth: "test-auth", fanslySessionId: "test-session" });

      // Create a PostMedia with a fanslyStatisticsId
      const channel = await createTestChannel();
      const post = await createTestPost(channel.id);
      const media = await createTestMedia();
      const postMedia = postMediaRepo.create({
        post,
        media,
        order: 0,
        fanslyStatisticsId: "fake-stats-id",
      });
      await postMediaRepo.save(postMedia);

      // Verify credentials are not stale before the call
      const beforeData = await loadFanslyCredentials();
      expect(beforeData?.stale).toBe(false);

      // Mock fetch to return 401
      const originalFetch = globalThis.fetch;
      globalThis.fetch = Object.assign(
        mock(() => Promise.resolve(new Response("Unauthorized", { status: 401 }))),
        { preconnect: globalThis.fetch.preconnect },
      ) as typeof fetch;

      try {
        await fetchFanslyAnalyticsData(postMedia.id);
        throw new Error("Should have thrown");
      } catch (error) {
        expect(isAppError(error)).toBe(true);
      } finally {
        globalThis.fetch = originalFetch;
      }

      // Verify credentials are now stale
      const afterData = await loadFanslyCredentials();
      expect(afterData?.stale).toBe(true);
    });

    test("does not mark credentials stale on non-auth errors", async () => {
      const dataSource = getTestDataSource();
      const postMediaRepo = dataSource.getRepository(PostMedia);

      await saveFanslyCredentials({ fanslyAuth: "test-auth", fanslySessionId: "test-session" });

      const channel = await createTestChannel();
      const post = await createTestPost(channel.id);
      const media = await createTestMedia();
      const postMedia = postMediaRepo.create({
        post,
        media,
        order: 0,
        fanslyStatisticsId: "fake-stats-id",
      });
      await postMediaRepo.save(postMedia);

      // Mock fetch to return 500
      const originalFetch = globalThis.fetch;
      globalThis.fetch = Object.assign(
        mock(() => Promise.resolve(new Response("Server Error", { status: 500 }))),
        { preconnect: globalThis.fetch.preconnect },
      ) as typeof fetch;

      try {
        await fetchFanslyAnalyticsData(postMedia.id);
        throw new Error("Should have thrown");
      } catch (error) {
        expect(isAppError(error)).toBe(true);
      } finally {
        globalThis.fetch = originalFetch;
      }

      // Verify credentials are NOT stale
      const afterData = await loadFanslyCredentials();
      expect(afterData?.stale).toBe(false);
    });
  });

  describe("initializeAnalyticsAggregates", () => {
    test("sets plateauDetectedAt when plateau is detected in datapoints", async () => {
      const dataSource = getTestDataSource();
      const postMediaRepo = dataSource.getRepository(PostMedia);
      const dpRepo = dataSource.getRepository(FanslyAnalyticsDatapoint);
      const aggregateRepo = dataSource.getRepository(FanslyAnalyticsAggregate);

      // Post date is 20 days ago so datapoints are after it
      const postDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);
      const post = await createTestPost(undefined, { date: postDate });
      const media = await createTestMedia();
      const postMedia = postMediaRepo.create({ post, media, order: 0 });
      await postMediaRepo.save(postMedia);

      // Datapoints starting 15 days ago: big jump then flat for 7+ days (plateau)
      const baseTime = Date.now() - 15 * 24 * 60 * 60 * 1000;
      const dayMs = 24 * 60 * 60 * 1000;
      const viewCounts = [0, 100, 200, 300, 303, 305, 306, 307, 308, 309];
      await Promise.all(
        viewCounts.map((views, i) =>
          dpRepo.save(
            dpRepo.create({
              timestamp: baseTime + i * dayMs,
              views,
              interactionTime: views * 1000,
              postMedia,
              postMediaId: postMedia.id,
            }),
          ),
        ),
      );

      await initializeAnalyticsAggregates();

      const aggregate = await aggregateRepo.findOne({ where: { postMediaId: postMedia.id } });
      if (!aggregate) throw new Error("aggregate not found");
      expect(aggregate.plateauDetectedAt).toBeInstanceOf(Date);
    });

    test("does not set plateauDetectedAt when no plateau detected", async () => {
      const dataSource = getTestDataSource();
      const postMediaRepo = dataSource.getRepository(PostMedia);
      const dpRepo = dataSource.getRepository(FanslyAnalyticsDatapoint);
      const aggregateRepo = dataSource.getRepository(FanslyAnalyticsAggregate);

      // Post date is 10 days ago
      const postDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      const post = await createTestPost(undefined, { date: postDate });
      const media = await createTestMedia();
      const postMedia = postMediaRepo.create({ post, media, order: 0 });
      await postMediaRepo.save(postMedia);

      // Seed steadily growing datapoints — no plateau
      const baseTime = Date.now() - 8 * 24 * 60 * 60 * 1000;
      const dayMs = 24 * 60 * 60 * 1000;
      const viewCounts = [0, 100, 300, 700];
      await Promise.all(
        viewCounts.map((views, i) =>
          dpRepo.save(
            dpRepo.create({
              timestamp: baseTime + i * dayMs,
              views,
              interactionTime: views * 1000,
              postMedia,
              postMediaId: postMedia.id,
            }),
          ),
        ),
      );

      await initializeAnalyticsAggregates();

      const aggregate = await aggregateRepo.findOne({ where: { postMediaId: postMedia.id } });
      if (!aggregate) throw new Error("aggregate not found");
      expect(aggregate.plateauDetectedAt).toBeNil();
    });
  });

  describe("GET /api/analytics/active-fyp-posts", () => {
    const createActivePost = async (overrides?: {
      caption?: string | null;
      fypRemovedAt?: Date | null;
      fypManuallyRemoved?: boolean;
      fanslyStatisticsId?: string | null;
      totalViews?: number;
      averageEngagementPercent?: number;
      averageEngagementSeconds?: number;
      plateauDetectedAt?: Date;
    }) => {
      const dataSource = getTestDataSource();
      const postMediaRepo = dataSource.getRepository(PostMedia);
      const aggregateRepo = dataSource.getRepository(FanslyAnalyticsAggregate);

      const channel = await createTestChannel();
      const post = await createTestPost(channel.id, {
        caption: overrides?.caption ?? "Test caption",
        fypRemovedAt: overrides?.fypRemovedAt ?? null,
        fypManuallyRemoved: overrides?.fypManuallyRemoved ?? false,
      });
      const media = await createTestMedia();
      const postMedia = postMediaRepo.create({
        post,
        media,
        order: 0,
        fanslyStatisticsId: overrides?.fanslyStatisticsId ?? "stats-123",
      });
      await postMediaRepo.save(postMedia);

      const aggregate = aggregateRepo.create({
        postMedia,
        postMediaId: postMedia.id,
        totalViews: overrides?.totalViews ?? 100,
        averageEngagementSeconds: overrides?.averageEngagementSeconds ?? 30,
        averageEngagementPercent: overrides?.averageEngagementPercent ?? 50,
        plateauDetectedAt: overrides?.plateauDetectedAt,
      });
      await aggregateRepo.save(aggregate);

      return { channel, post, media, postMedia, aggregate };
    };

    test("returns active post with correct shape", async () => {
      const { post, media, postMedia } = await createActivePost();

      const res = await app.request("/api/analytics/active-fyp-posts");
      expect(res.status).toBe(200);

      const data = (await parseResponse<Array<Record<string, unknown>>>(res)) as Array<Record<string, unknown>>;
      expect(data).toBeArray();
      expect(data).toHaveLength(1);

      const item = data[0];
      expect(item.postMediaId).toBe(postMedia.id);
      expect(item.postId).toBe(post.id);
      expect(item.mediaId).toBe(media.id);
      expect(item.caption).toBe("Test caption");
      expect(item.totalViews).toBe(100);
      expect(item.averageEngagementPercent).toBe(50);
      expect(item.averageEngagementSeconds).toBe(30);
    });

    test("excludes manually removed posts", async () => {
      await createActivePost({ fypManuallyRemoved: true });

      const res = await app.request("/api/analytics/active-fyp-posts");
      expect(res.status).toBe(200);

      const data = await parseResponse<Array<Record<string, unknown>>>(res);
      expect(data).toHaveLength(0);
    });

    test("excludes posts with plateauDetectedAt set", async () => {
      await createActivePost({ plateauDetectedAt: new Date() });

      const res = await app.request("/api/analytics/active-fyp-posts");
      expect(res.status).toBe(200);

      const data = await parseResponse<Array<Record<string, unknown>>>(res);
      expect(data).toHaveLength(0);
    });

    test("excludes posts with fypRemovedAt set", async () => {
      await createActivePost({ fypRemovedAt: new Date() });

      const res = await app.request("/api/analytics/active-fyp-posts");
      expect(res.status).toBe(200);

      const data = await parseResponse<Array<Record<string, unknown>>>(res);
      expect(data).toHaveLength(0);
    });

    test("sorts by views ascending (worst-to-best)", async () => {
      await createActivePost({ totalViews: 500 });
      await createActivePost({ totalViews: 100 });
      await createActivePost({ totalViews: 300 });

      const res = await app.request("/api/analytics/active-fyp-posts?sortBy=views");
      expect(res.status).toBe(200);

      const data = (await parseResponse<Array<{ totalViews: number }>>(res)) as Array<{ totalViews: number }>;
      expect(data).toHaveLength(3);
      expect(data[0].totalViews).toBe(100);
      expect(data[1].totalViews).toBe(300);
      expect(data[2].totalViews).toBe(500);
    });

    test("sorts by engagementPercent ascending", async () => {
      await createActivePost({ averageEngagementPercent: 80 });
      await createActivePost({ averageEngagementPercent: 20 });
      await createActivePost({ averageEngagementPercent: 50 });

      const res = await app.request("/api/analytics/active-fyp-posts?sortBy=engagementPercent");
      expect(res.status).toBe(200);

      const data = (await parseResponse<Array<{ averageEngagementPercent: number }>>(res)) as Array<{ averageEngagementPercent: number }>;
      expect(data).toHaveLength(3);
      expect(data[0].averageEngagementPercent).toBe(20);
      expect(data[1].averageEngagementPercent).toBe(50);
      expect(data[2].averageEngagementPercent).toBe(80);
    });

    test("sorts by engagementSeconds ascending", async () => {
      await createActivePost({ averageEngagementSeconds: 60 });
      await createActivePost({ averageEngagementSeconds: 10 });
      await createActivePost({ averageEngagementSeconds: 35 });

      const res = await app.request("/api/analytics/active-fyp-posts?sortBy=engagementSeconds");
      expect(res.status).toBe(200);

      const data = (await parseResponse<Array<{ averageEngagementSeconds: number }>>(res)) as Array<{ averageEngagementSeconds: number }>;
      expect(data).toHaveLength(3);
      expect(data[0].averageEngagementSeconds).toBe(10);
      expect(data[1].averageEngagementSeconds).toBe(35);
      expect(data[2].averageEngagementSeconds).toBe(60);
    });

    test("returns empty array when no active posts", async () => {
      const res = await app.request("/api/analytics/active-fyp-posts");
      expect(res.status).toBe(200);

      const data = await parseResponse<Array<Record<string, unknown>>>(res);
      expect(data).toHaveLength(0);
    });
  });
});
