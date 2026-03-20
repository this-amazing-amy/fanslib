import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { Hono } from "hono";
import "reflect-metadata";
import { devalueMiddleware } from "../../lib/devalue-middleware";
import { getTestDataSource, setupTestDatabase, teardownTestDatabase } from "../../lib/test-db";
import { resetAllFixtures } from "../../lib/test-fixtures";
import { createTestMedia, createTestPost } from "../../test-utils/setup";
import { PostMedia } from "../posts/entity";
import { FanslyAnalyticsAggregate, FanslyAnalyticsDatapoint } from "./entity";
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
          dpRepo.save(dpRepo.create({ timestamp: baseTime + i * dayMs, views, interactionTime: views * 1000, postMedia, postMediaId: postMedia.id }))
        )
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
          dpRepo.save(dpRepo.create({ timestamp: baseTime + i * dayMs, views, interactionTime: views * 1000, postMedia, postMediaId: postMedia.id }))
        )
      );

      await initializeAnalyticsAggregates();

      const aggregate = await aggregateRepo.findOne({ where: { postMediaId: postMedia.id } });
      if (!aggregate) throw new Error("aggregate not found");
      expect(aggregate.plateauDetectedAt).toBeNil();
    });
  });
});
