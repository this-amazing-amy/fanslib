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

    test("includes datapoints array for sparkline rendering", async () => {
      const dataSource = getTestDataSource();
      const dpRepo = dataSource.getRepository(FanslyAnalyticsDatapoint);

      const { postMedia } = await createActivePost();

      // Seed datapoints
      const baseTime = Date.now() - 5 * 24 * 60 * 60 * 1000;
      const dayMs = 24 * 60 * 60 * 1000;
      await Promise.all(
        [0, 50, 80, 95, 100].map((views, i) =>
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

      const res = await app.request("/api/analytics/active-fyp-posts");
      expect(res.status).toBe(200);

      type PostWithDatapoints = {
        datapoints: Array<{ timestamp: number; views: number; interactionTime: number }>;
      };
      const data = (await parseResponse<PostWithDatapoints[]>(res)) as PostWithDatapoints[];
      expect(data).toHaveLength(1);
      expect(data[0].datapoints).toBeArray();
      expect(data[0].datapoints).toHaveLength(5);
      expect(data[0].datapoints[0].views).toBe(0);
      expect(data[0].datapoints[4].views).toBe(100);
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

  describe("GET /api/analytics/queue", () => {
    test("returns empty queue state when no aggregates exist", async () => {
      const res = await app.request("/api/analytics/queue");
      expect(res.status).toBe(200);

      const data = await parseResponse<{ totalPending: number; nextFetchAt: null; items: unknown[] }>(res);
      expect(data?.totalPending).toBe(0);
      expect(data?.nextFetchAt).toBeNull();
      expect(data?.items).toEqual([]);
    });

    test("excludes items with nextFetchAt = null (halted/plateaued)", async () => {
      const dataSource = getTestDataSource();
      const postMediaRepo = dataSource.getRepository(PostMedia);
      const aggregateRepo = dataSource.getRepository(FanslyAnalyticsAggregate);

      const channel = await createTestChannel();
      const post = await createTestPost(channel.id, { caption: "Halted post" });
      const media = await createTestMedia();
      const postMedia = postMediaRepo.create({ post, media, order: 0 });
      await postMediaRepo.save(postMedia);

      // Aggregate with no nextFetchAt (halted)
      const aggregate = aggregateRepo.create({
        postMedia,
        postMediaId: postMedia.id,
        totalViews: 100,
        averageEngagementSeconds: 30,
        averageEngagementPercent: 50,
        nextFetchAt: undefined,
      });
      await aggregateRepo.save(aggregate);

      const res = await app.request("/api/analytics/queue");
      expect(res.status).toBe(200);

      const data = await parseResponse<{ totalPending: number; items: unknown[] }>(res);
      expect(data?.totalPending).toBe(0);
      expect(data?.items).toEqual([]);
    });

    test("returns correct totalPending count for items with non-null nextFetchAt", async () => {
      const dataSource = getTestDataSource();
      const postMediaRepo = dataSource.getRepository(PostMedia);
      const aggregateRepo = dataSource.getRepository(FanslyAnalyticsAggregate);
      const channel = await createTestChannel();

      // Create 2 items with nextFetchAt and 1 without
      const createQueueItem = async (nextFetchAt?: Date) => {
        const post = await createTestPost(channel.id);
        const media = await createTestMedia();
        const pm = postMediaRepo.create({ post, media, order: 0 });
        await postMediaRepo.save(pm);
        await aggregateRepo.save(
          aggregateRepo.create({
            postMedia: pm,
            postMediaId: pm.id,
            totalViews: 100,
            averageEngagementSeconds: 30,
            averageEngagementPercent: 50,
            nextFetchAt,
          }),
        );
      };
      await createQueueItem(new Date(Date.now() + 60000));
      await createQueueItem(new Date(Date.now() + 120000));
      await createQueueItem(undefined);

      const res = await app.request("/api/analytics/queue");
      expect(res.status).toBe(200);

      const data = await parseResponse<{ totalPending: number; items: unknown[] }>(res);
      expect(data?.totalPending).toBe(2);
      expect(data?.items).toHaveLength(2);
    });

    test("returns the earliest nextFetchAt as the top-level nextFetchAt", async () => {
      const dataSource = getTestDataSource();
      const postMediaRepo = dataSource.getRepository(PostMedia);
      const aggregateRepo = dataSource.getRepository(FanslyAnalyticsAggregate);
      const channel = await createTestChannel();

      const earliest = new Date(Date.now() + 30000);
      const later = new Date(Date.now() + 120000);

      const createWithFetchAt = async (nextFetchAt: Date) => {
        const post = await createTestPost(channel.id);
        const media = await createTestMedia();
        const pm = postMediaRepo.create({ post, media, order: 0 });
        await postMediaRepo.save(pm);
        await aggregateRepo.save(
          aggregateRepo.create({
            postMedia: pm,
            postMediaId: pm.id,
            totalViews: 100,
            averageEngagementSeconds: 30,
            averageEngagementPercent: 50,
            nextFetchAt,
          }),
        );
      };
      await createWithFetchAt(later);
      await createWithFetchAt(earliest);

      const res = await app.request("/api/analytics/queue");
      expect(res.status).toBe(200);

      const data = await parseResponse<{ nextFetchAt: Date }>(res);
      expect(new Date(data?.nextFetchAt as Date).toISOString()).toBe(earliest.toISOString());
    });

    test("each item includes postMediaId, nextFetchAt, caption, thumbnailUrl, overdue", async () => {
      const dataSource = getTestDataSource();
      const postMediaRepo = dataSource.getRepository(PostMedia);
      const aggregateRepo = dataSource.getRepository(FanslyAnalyticsAggregate);
      const channel = await createTestChannel();

      const nextFetch = new Date(Date.now() + 60000);
      const post = await createTestPost(channel.id, { caption: "My caption" });
      const media = await createTestMedia();
      const pm = postMediaRepo.create({ post, media, order: 0 });
      await postMediaRepo.save(pm);
      await aggregateRepo.save(
        aggregateRepo.create({
          postMedia: pm,
          postMediaId: pm.id,
          totalViews: 100,
          averageEngagementSeconds: 30,
          averageEngagementPercent: 50,
          nextFetchAt: nextFetch,
        }),
      );

      const res = await app.request("/api/analytics/queue");
      expect(res.status).toBe(200);

      type QueueItem = {
        postMediaId: string;
        nextFetchAt: string;
        caption: string | null;
        thumbnailUrl: string;
        overdue: boolean;
      };
      const data = await parseResponse<{ items: QueueItem[] }>(res);
      const item = data?.items[0];
      expect(item?.postMediaId).toBe(pm.id);
      expect(new Date(item?.nextFetchAt as string).toISOString()).toBe(nextFetch.toISOString());
      expect(item?.caption).toBe("My caption");
      expect(item?.thumbnailUrl).toBe(`thumbnail://${media.id}`);
      expect(item?.overdue).toBe(false);
    });

    test("items where nextFetchAt <= now have overdue: true", async () => {
      const dataSource = getTestDataSource();
      const postMediaRepo = dataSource.getRepository(PostMedia);
      const aggregateRepo = dataSource.getRepository(FanslyAnalyticsAggregate);
      const channel = await createTestChannel();

      // Past date = overdue
      const pastDate = new Date(Date.now() - 60000);
      const post = await createTestPost(channel.id);
      const media = await createTestMedia();
      const pm = postMediaRepo.create({ post, media, order: 0 });
      await postMediaRepo.save(pm);
      await aggregateRepo.save(
        aggregateRepo.create({
          postMedia: pm,
          postMediaId: pm.id,
          totalViews: 100,
          averageEngagementSeconds: 30,
          averageEngagementPercent: 50,
          nextFetchAt: pastDate,
        }),
      );

      const res = await app.request("/api/analytics/queue");
      expect(res.status).toBe(200);

      const data = await parseResponse<{ items: Array<{ overdue: boolean }> }>(res);
      expect(data?.items[0]?.overdue).toBe(true);
    });

    test("items are sorted by nextFetchAt ascending", async () => {
      const dataSource = getTestDataSource();
      const postMediaRepo = dataSource.getRepository(PostMedia);
      const aggregateRepo = dataSource.getRepository(FanslyAnalyticsAggregate);
      const channel = await createTestChannel();

      const times = [
        new Date(Date.now() + 300000),
        new Date(Date.now() + 60000),
        new Date(Date.now() + 180000),
      ];

      const createSorted = async (nextFetchAt: Date) => {
        const post = await createTestPost(channel.id);
        const media = await createTestMedia();
        const pm = postMediaRepo.create({ post, media, order: 0 });
        await postMediaRepo.save(pm);
        await aggregateRepo.save(
          aggregateRepo.create({
            postMedia: pm,
            postMediaId: pm.id,
            totalViews: 100,
            averageEngagementSeconds: 30,
            averageEngagementPercent: 50,
            nextFetchAt,
          }),
        );
      };
      await createSorted(times[0]);
      await createSorted(times[1]);
      await createSorted(times[2]);

      const res = await app.request("/api/analytics/queue");
      expect(res.status).toBe(200);

      const data = await parseResponse<{ items: Array<{ nextFetchAt: string | Date }> }>(res);
      const fetchAts = data?.items.map((i) => new Date(i.nextFetchAt).toISOString()) ?? [];
      const sorted = [...fetchAts].sort();
      expect(fetchAts).toEqual(sorted);
    });
  });

  describe("GET /api/analytics/repost-candidates", () => {
    // Helper: create a PostMedia linked to a Media with an analytics aggregate.
    // By default creates a naturally-plateaued PostMedia (eligible for repost).
    const createPostMediaWithAggregate = async (opts: {
      media: Awaited<ReturnType<typeof createTestMedia>>;
      channelId: string;
      caption?: string | null;
      fypRemovedAt?: Date | null;
      fypManuallyRemoved?: boolean;
      totalViews?: number;
      averageEngagementPercent?: number;
      averageEngagementSeconds?: number;
      plateauDetectedAt?: Date | null;
      postDate?: Date;
    }) => {
      const dataSource = getTestDataSource();
      const postMediaRepo = dataSource.getRepository(PostMedia);
      const aggregateRepo = dataSource.getRepository(FanslyAnalyticsAggregate);

      const post = await createTestPost(opts.channelId, {
        caption: opts.caption ?? "Test caption",
        fypRemovedAt: opts.fypRemovedAt ?? null,
        fypManuallyRemoved: opts.fypManuallyRemoved ?? false,
        date: opts.postDate ?? new Date(),
      });

      const postMedia = postMediaRepo.create({
        post,
        media: opts.media,
        order: 0,
        fanslyStatisticsId: `stats-${Date.now()}-${Math.random()}`,
      });
      await postMediaRepo.save(postMedia);

      const aggregate = aggregateRepo.create({
        postMedia,
        postMediaId: postMedia.id,
        totalViews: opts.totalViews ?? 100,
        averageEngagementSeconds: opts.averageEngagementSeconds ?? 30,
        averageEngagementPercent: opts.averageEngagementPercent ?? 50,
        plateauDetectedAt: opts.plateauDetectedAt === null ? undefined : (opts.plateauDetectedAt ?? new Date()),
      });
      await aggregateRepo.save(aggregate);

      return { post, postMedia, aggregate };
    };

    test("returns eligible Media with a single naturally-plateaued PostMedia", async () => {
      const channel = await createTestChannel();
      const media = await createTestMedia();
      await createPostMediaWithAggregate({
        media,
        channelId: channel.id,
        totalViews: 500,
        averageEngagementPercent: 45,
        averageEngagementSeconds: 60,
      });

      const res = await app.request("/api/analytics/repost-candidates");
      expect(res.status).toBe(200);

      const data = (await parseResponse<Array<Record<string, unknown>>>(res)) as Array<Record<string, unknown>>;
      expect(data).toBeArray();
      expect(data).toHaveLength(1);

      const item = data[0];
      expect(item.mediaId).toBe(media.id);
      expect(item.caption).toBe("Test caption");
      expect(item.totalViews).toBe(500);
      expect(item.averageEngagementPercent).toBe(45);
      expect(item.averageEngagementSeconds).toBe(60);
      expect(item.timesPosted).toBe(1);
    });
    test("picks best-ever stats across multiple PostMedia for same Media", async () => {
      const channel = await createTestChannel();
      const media = await createTestMedia();

      // PostMedia 1: best views, lower engagement
      await createPostMediaWithAggregate({
        media,
        channelId: channel.id,
        totalViews: 1000,
        averageEngagementPercent: 20,
        averageEngagementSeconds: 15,
        postDate: new Date("2025-01-01"),
      });

      // PostMedia 2: lower views, best engagement
      await createPostMediaWithAggregate({
        media,
        channelId: channel.id,
        totalViews: 500,
        averageEngagementPercent: 80,
        averageEngagementSeconds: 120,
        postDate: new Date("2025-02-01"),
      });

      const res = await app.request("/api/analytics/repost-candidates");
      expect(res.status).toBe(200);

      const data = (await parseResponse<Array<Record<string, unknown>>>(res)) as Array<Record<string, unknown>>;
      expect(data).toHaveLength(1);
      expect(data[0].totalViews).toBe(1000);
      expect(data[0].averageEngagementPercent).toBe(80);
      expect(data[0].averageEngagementSeconds).toBe(120);
      expect(data[0].timesPosted).toBe(2);
    });

    test("uses caption from best-performing PostMedia", async () => {
      const channel = await createTestChannel();
      const media = await createTestMedia();

      // Lower performing
      await createPostMediaWithAggregate({
        media,
        channelId: channel.id,
        caption: "Worse caption",
        totalViews: 100,
        postDate: new Date("2025-01-01"),
      });

      // Best performing (highest views)
      await createPostMediaWithAggregate({
        media,
        channelId: channel.id,
        caption: "Best caption",
        totalViews: 900,
        postDate: new Date("2025-02-01"),
      });

      const res = await app.request("/api/analytics/repost-candidates");
      expect(res.status).toBe(200);

      const data = (await parseResponse<Array<{ caption: string }>>(res)) as Array<{ caption: string }>;
      expect(data).toHaveLength(1);
      expect(data[0].caption).toBe("Best caption");
    });

    test("redemption rule — older manual removal + newer natural plateau = eligible", async () => {
      const channel = await createTestChannel();
      const media = await createTestMedia();

      // Older PostMedia: manually removed
      await createPostMediaWithAggregate({
        media,
        channelId: channel.id,
        fypManuallyRemoved: true,
        fypRemovedAt: new Date("2025-01-15"),
        postDate: new Date("2025-01-01"),
      });

      // Newer PostMedia: naturally plateaued (redemption)
      await createPostMediaWithAggregate({
        media,
        channelId: channel.id,
        totalViews: 300,
        postDate: new Date("2025-03-01"),
      });

      const res = await app.request("/api/analytics/repost-candidates");
      expect(res.status).toBe(200);

      const data = (await parseResponse<Array<Record<string, unknown>>>(res)) as Array<Record<string, unknown>>;
      expect(data).toHaveLength(1);
      expect(data[0].mediaId).toBe(media.id);
      expect(data[0].timesPosted).toBe(2);
    });

    test("excludes Media where most recent PostMedia was manually removed", async () => {
      const channel = await createTestChannel();
      const media = await createTestMedia();

      // Older PostMedia: naturally plateaued
      await createPostMediaWithAggregate({
        media,
        channelId: channel.id,
        postDate: new Date("2025-01-01"),
      });

      // Most recent PostMedia: manually removed
      await createPostMediaWithAggregate({
        media,
        channelId: channel.id,
        fypManuallyRemoved: true,
        fypRemovedAt: new Date(),
        postDate: new Date("2025-03-01"),
      });

      const res = await app.request("/api/analytics/repost-candidates");
      expect(res.status).toBe(200);

      const data = await parseResponse<Array<Record<string, unknown>>>(res);
      expect(data).toHaveLength(0);
    });

    test("sorts by views descending (best-to-worst)", async () => {
      const channel = await createTestChannel();

      const media1 = await createTestMedia();
      await createPostMediaWithAggregate({ media: media1, channelId: channel.id, totalViews: 200 });

      const media2 = await createTestMedia();
      await createPostMediaWithAggregate({ media: media2, channelId: channel.id, totalViews: 800 });

      const media3 = await createTestMedia();
      await createPostMediaWithAggregate({ media: media3, channelId: channel.id, totalViews: 400 });

      const res = await app.request("/api/analytics/repost-candidates?sortBy=views");
      expect(res.status).toBe(200);

      const data = (await parseResponse<Array<{ totalViews: number }>>(res)) as Array<{ totalViews: number }>;
      expect(data).toHaveLength(3);
      expect(data[0].totalViews).toBe(800);
      expect(data[1].totalViews).toBe(400);
      expect(data[2].totalViews).toBe(200);
    });

    test("sorts by engagementPercent descending", async () => {
      const channel = await createTestChannel();

      const media1 = await createTestMedia();
      await createPostMediaWithAggregate({ media: media1, channelId: channel.id, averageEngagementPercent: 30 });

      const media2 = await createTestMedia();
      await createPostMediaWithAggregate({ media: media2, channelId: channel.id, averageEngagementPercent: 90 });

      const media3 = await createTestMedia();
      await createPostMediaWithAggregate({ media: media3, channelId: channel.id, averageEngagementPercent: 60 });

      const res = await app.request("/api/analytics/repost-candidates?sortBy=engagementPercent");
      expect(res.status).toBe(200);

      const data = (await parseResponse<Array<{ averageEngagementPercent: number }>>(res)) as Array<{ averageEngagementPercent: number }>;
      expect(data).toHaveLength(3);
      expect(data[0].averageEngagementPercent).toBe(90);
      expect(data[1].averageEngagementPercent).toBe(60);
      expect(data[2].averageEngagementPercent).toBe(30);
    });

    test("sorts by engagementSeconds descending", async () => {
      const channel = await createTestChannel();

      const media1 = await createTestMedia();
      await createPostMediaWithAggregate({ media: media1, channelId: channel.id, averageEngagementSeconds: 15 });

      const media2 = await createTestMedia();
      await createPostMediaWithAggregate({ media: media2, channelId: channel.id, averageEngagementSeconds: 90 });

      const media3 = await createTestMedia();
      await createPostMediaWithAggregate({ media: media3, channelId: channel.id, averageEngagementSeconds: 45 });

      const res = await app.request("/api/analytics/repost-candidates?sortBy=engagementSeconds");
      expect(res.status).toBe(200);

      const data = (await parseResponse<Array<{ averageEngagementSeconds: number }>>(res)) as Array<{ averageEngagementSeconds: number }>;
      expect(data).toHaveLength(3);
      expect(data[0].averageEngagementSeconds).toBe(90);
      expect(data[1].averageEngagementSeconds).toBe(45);
      expect(data[2].averageEngagementSeconds).toBe(15);
    });

    test("returns empty array when no eligible candidates", async () => {
      const res = await app.request("/api/analytics/repost-candidates");
      expect(res.status).toBe(200);

      const data = await parseResponse<Array<Record<string, unknown>>>(res);
      expect(data).toHaveLength(0);
    });

    test("excludes Media with any PostMedia still active on FYP", async () => {
      const channel = await createTestChannel();
      const media = await createTestMedia();

      // First PostMedia: naturally plateaued
      await createPostMediaWithAggregate({
        media,
        channelId: channel.id,
        postDate: new Date("2025-01-01"),
      });

      // Second PostMedia: still active (no plateau, not removed)
      await createPostMediaWithAggregate({
        media,
        channelId: channel.id,
        plateauDetectedAt: null,
        postDate: new Date("2025-02-01"),
      });

      const res = await app.request("/api/analytics/repost-candidates");
      expect(res.status).toBe(200);

      const data = await parseResponse<Array<Record<string, unknown>>>(res);
      expect(data).toHaveLength(0);
    });
  });
});
