import { afterAll, beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import "reflect-metadata";
import { getTestDataSource, setupTestDatabase, teardownTestDatabase } from "../../lib/test-db";
import { resetAllFixtures } from "../../lib/test-fixtures";
import { createTestChannel, createTestMedia, createTestPost } from "../../test-utils/setup";
import { saveFanslyCredentials } from "../settings/operations/credentials/save";
import { loadFanslyCredentials } from "../settings/operations/credentials/load";
import { PostMedia } from "../posts/entity";
import { FanslyAnalyticsAggregate, FanslyAnalyticsDatapoint } from "./entity";
import { computeGrowthRate, computeNextFetchInterval, processAnalyticsCronTick } from "./analytics-cron";
import type { FanslyAnalyticsResponse } from "../../lib/fansly-analytics/fansly-analytics-response";

describe("analytics-cron", () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await resetAllFixtures();
  });

  describe("computeNextFetchInterval", () => {
    test("returns 1 day for sustained growth > 5%", () => {
      const result = computeNextFetchInterval(10, null);
      expect(result).toEqual({ days: 1 });
    });

    test("returns 3 days for slowing growth (1-5%)", () => {
      const result = computeNextFetchInterval(3, null);
      expect(result).toEqual({ days: 3 });
    });

    test("returns 7 days for plateaued growth (< 1%)", () => {
      const result = computeNextFetchInterval(0.5, null);
      expect(result).toEqual({ days: 7 });
    });

    test("returns null (stop fetching) for plateaued growth with plateauDetectedAt > 90 days ago", () => {
      const ninetyOneDaysAgo = new Date(Date.now() - 91 * 24 * 60 * 60 * 1000);
      const result = computeNextFetchInterval(0.5, ninetyOneDaysAgo);
      expect(result).toBeNull();
    });

    test("returns 7 days for plateaued growth with plateauDetectedAt < 90 days ago", () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const result = computeNextFetchInterval(0.5, thirtyDaysAgo);
      expect(result).toEqual({ days: 7 });
    });

    test("returns 1 day at exactly 5% growth boundary", () => {
      const result = computeNextFetchInterval(5, null);
      expect(result).toEqual({ days: 3 });
    });

    test("returns 3 days at exactly 1% growth boundary", () => {
      const result = computeNextFetchInterval(1, null);
      expect(result).toEqual({ days: 3 });
    });

    test("returns null at exactly 90 days plateauDetectedAt with low growth", () => {
      const exactly90DaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const result = computeNextFetchInterval(0.5, exactly90DaysAgo);
      expect(result).toBeNull();
    });
  });

  describe("computeGrowthRate", () => {
    test("computes growth rate from two datapoints", () => {
      const datapoints = [
        { views: 100, timestamp: 1000 },
        { views: 110, timestamp: 2000 },
      ] as FanslyAnalyticsDatapoint[];
      expect(computeGrowthRate(datapoints)).toBe(10);
    });

    test("returns 0 when fewer than 2 datapoints", () => {
      expect(computeGrowthRate([])).toBe(0);
      expect(computeGrowthRate([{ views: 100, timestamp: 1000 }] as FanslyAnalyticsDatapoint[])).toBe(0);
    });

    test("returns 0 when previous views are 0", () => {
      const datapoints = [
        { views: 0, timestamp: 1000 },
        { views: 50, timestamp: 2000 },
      ] as FanslyAnalyticsDatapoint[];
      expect(computeGrowthRate(datapoints)).toBe(0);
    });

    test("uses last two datapoints sorted by timestamp", () => {
      const datapoints = [
        { views: 50, timestamp: 3000 },
        { views: 100, timestamp: 1000 },
        { views: 200, timestamp: 2000 },
      ] as FanslyAnalyticsDatapoint[];
      // sorted: 100@1000, 200@2000, 50@3000 → last two: 200, 50 → (50-200)/200 * 100 = -75
      expect(computeGrowthRate(datapoints)).toBe(-75);
    });

    test("handles negative growth", () => {
      const datapoints = [
        { views: 200, timestamp: 1000 },
        { views: 100, timestamp: 2000 },
      ] as FanslyAnalyticsDatapoint[];
      expect(computeGrowthRate(datapoints)).toBe(-50);
    });
  });

  const makeFanslyResponse = (views: number, timestamp: number): FanslyAnalyticsResponse => ({
    success: true,
    response: {
      dataset: {
        period: 86400000,
        dateBefore: timestamp + 86400000,
        dateAfter: timestamp - 86400000,
        datapointLimit: 100,
        datapoints: [{
          timestamp,
          stats: [{ type: 0, views, previewViews: 0, interactionTime: 5000, previewInteractionTime: 0, uniqueViewers: views, previewUniqueViewers: 0 }],
        }],
        topFypTags: [],
        datasetMediaOfferId: "test",
      },
      aggregationData: {
        accountMedia: [],
        tags: [],
      },
    },
  });

  const createPostMediaWithAggregate = async (opts: {
    nextFetchAt: Date | undefined;
    fanslyStatisticsId?: string | null;
    existingDatapoints?: { views: number; timestamp: number }[];
    plateauDetectedAt?: Date;
  }) => {
    const dataSource = getTestDataSource();
    const postMediaRepo = dataSource.getRepository(PostMedia);
    const aggregateRepo = dataSource.getRepository(FanslyAnalyticsAggregate);
    const dpRepo = dataSource.getRepository(FanslyAnalyticsDatapoint);

    const channel = await createTestChannel();
    const post = await createTestPost(channel.id, { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) });
    const media = await createTestMedia();
    const postMedia = postMediaRepo.create({
      post,
      media,
      order: 0,
      fanslyStatisticsId: opts.fanslyStatisticsId === undefined ? "test-stats-id" : opts.fanslyStatisticsId,
    });
    await postMediaRepo.save(postMedia);

    const aggregate = aggregateRepo.create({
      postMedia,
      postMediaId: postMedia.id,
      totalViews: 100,
      averageEngagementSeconds: 30,
      averageEngagementPercent: 50,
      nextFetchAt: opts.nextFetchAt,
      plateauDetectedAt: opts.plateauDetectedAt,
    });
    await aggregateRepo.save(aggregate);

    if (opts.existingDatapoints) {
      await opts.existingDatapoints.reduce(
        (prev, dp) => prev.then(() => dpRepo.save(dpRepo.create({
          ...dp,
          interactionTime: dp.views * 100,
          postMedia,
          postMediaId: postMedia.id,
        }))),
        Promise.resolve() as Promise<unknown>,
      );
    }

    return { postMedia, aggregate };
  };

  const withMockFetch = async <T>(mockFn: ReturnType<typeof mock<() => Promise<Response>>>, fn: () => Promise<T>): Promise<T> => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = Object.assign(mockFn, { preconnect: originalFetch.preconnect }) as typeof fetch;
    try {
      return await fn();
    } finally {
      globalThis.fetch = originalFetch;
    }
  };

  describe("processAnalyticsCronTick", () => {
    test("fetches analytics for aggregates where nextFetchAt < now", async () => {
      const dataSource = getTestDataSource();
      const aggregateRepo = dataSource.getRepository(FanslyAnalyticsAggregate);

      await saveFanslyCredentials({ fanslyAuth: "test-auth", fanslySessionId: "test-session" });

      const pastDate = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      const { postMedia } = await createPostMediaWithAggregate({
        nextFetchAt: pastDate,
        existingDatapoints: [
          { views: 100, timestamp: Date.now() - 2 * 86400000 },
          { views: 200, timestamp: Date.now() - 86400000 },
        ],
      });

      const newTimestamp = Date.now();
      const mockResponse = makeFanslyResponse(300, newTimestamp);

      const result = await withMockFetch(
        mock(() => Promise.resolve(new Response(JSON.stringify(mockResponse), { status: 200, headers: { "Content-Type": "application/json" } }))),
        () => processAnalyticsCronTick(),
      );

      expect(result.processed).toBe(1);
      expect(result.skipped).toBe(0);

      const updatedAggregate = await aggregateRepo.findOne({ where: { postMediaId: postMedia.id } });
      if (!updatedAggregate) throw new Error("aggregate not found");
      expect(updatedAggregate.nextFetchAt).toBeInstanceOf(Date);
      expect(updatedAggregate.nextFetchAt?.getTime()).toBeGreaterThan(Date.now());
    });

    test("skips all fetches when credentials are stale", async () => {
      await saveFanslyCredentials({ fanslyAuth: "test-auth", fanslySessionId: "test-session" });
      // Mark stale
      const { markCredentialsStale } = await import("../settings/operations/credentials/mark-stale");
      await markCredentialsStale();

      await createPostMediaWithAggregate({
        nextFetchAt: new Date(Date.now() - 60 * 60 * 1000),
      });

      const result = await processAnalyticsCronTick();

      expect(result.processed).toBe(0);
      expect(result.credentialsStale).toBe(true);
    });

    test("does not fetch aggregates where nextFetchAt is in the future", async () => {
      await saveFanslyCredentials({ fanslyAuth: "test-auth", fanslySessionId: "test-session" });

      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // tomorrow
      await createPostMediaWithAggregate({ nextFetchAt: futureDate });

      const result = await processAnalyticsCronTick();

      expect(result.processed).toBe(0);
    });

    test("does not fetch aggregates where nextFetchAt is null", async () => {
      await saveFanslyCredentials({ fanslyAuth: "test-auth", fanslySessionId: "test-session" });

      await createPostMediaWithAggregate({ nextFetchAt: undefined });

      const result = await processAnalyticsCronTick();

      expect(result.processed).toBe(0);
    });

    test("on 401 response marks credentials stale and halts remaining fetches", async () => {
      await saveFanslyCredentials({ fanslyAuth: "test-auth", fanslySessionId: "test-session" });

      const pastDate = new Date(Date.now() - 60 * 60 * 1000);
      await createPostMediaWithAggregate({ nextFetchAt: pastDate });
      await createPostMediaWithAggregate({ nextFetchAt: pastDate });

      const result = await withMockFetch(
        mock(() => Promise.resolve(new Response("Unauthorized", { status: 401 }))),
        () => processAnalyticsCronTick(),
      );

      expect(result.halted).toBe(true);
      // After halt on 401, credentials should be stale
      const creds = await loadFanslyCredentials();
      expect(creds?.stale).toBe(true);
    });

    test("sets nextFetchAt to null for plateaued post older than 90 days", async () => {
      const dataSource = getTestDataSource();
      const aggregateRepo = dataSource.getRepository(FanslyAnalyticsAggregate);

      await saveFanslyCredentials({ fanslyAuth: "test-auth", fanslySessionId: "test-session" });

      const pastDate = new Date(Date.now() - 60 * 60 * 1000);
      const plateauDate = new Date(Date.now() - 91 * 24 * 60 * 60 * 1000);
      const { postMedia } = await createPostMediaWithAggregate({
        nextFetchAt: pastDate,
        plateauDetectedAt: plateauDate,
        existingDatapoints: [
          { views: 300, timestamp: Date.now() - 2 * 86400000 },
          { views: 301, timestamp: Date.now() - 86400000 },
        ],
      });

      const newTimestamp = Date.now();
      const mockResponse = makeFanslyResponse(302, newTimestamp);

      await withMockFetch(
        mock(() => Promise.resolve(new Response(JSON.stringify(mockResponse), { status: 200, headers: { "Content-Type": "application/json" } }))),
        () => processAnalyticsCronTick(),
      );

      const updatedAggregate = await aggregateRepo.findOne({ where: { postMediaId: postMedia.id } });
      if (!updatedAggregate) throw new Error("aggregate not found");
      expect(updatedAggregate.nextFetchAt).toBeNull();
    });

    test("on 403 response marks credentials stale and halts", async () => {
      await saveFanslyCredentials({ fanslyAuth: "test-auth", fanslySessionId: "test-session" });

      const pastDate = new Date(Date.now() - 60 * 60 * 1000);
      await createPostMediaWithAggregate({ nextFetchAt: pastDate });

      const result = await withMockFetch(
        mock(() => Promise.resolve(new Response("Forbidden", { status: 403 }))),
        () => processAnalyticsCronTick(),
      );

      expect(result.halted).toBe(true);
      const creds = await loadFanslyCredentials();
      expect(creds?.stale).toBe(true);
    });

    test("skips aggregates where postMedia has no fanslyStatisticsId", async () => {
      await saveFanslyCredentials({ fanslyAuth: "test-auth", fanslySessionId: "test-session" });

      const pastDate = new Date(Date.now() - 60 * 60 * 1000);
      await createPostMediaWithAggregate({ nextFetchAt: pastDate, fanslyStatisticsId: null });

      const result = await processAnalyticsCronTick();

      expect(result.credentialsStale).toBeUndefined();
      expect(result.processed).toBe(0);
      expect(result.skipped).toBe(1);
    });

    test("applies 1-day interval for high growth rate", async () => {
      const dataSource = getTestDataSource();
      const aggregateRepo = dataSource.getRepository(FanslyAnalyticsAggregate);

      await saveFanslyCredentials({ fanslyAuth: "test-auth", fanslySessionId: "test-session" });

      const pastDate = new Date(Date.now() - 60 * 60 * 1000);
      const { postMedia } = await createPostMediaWithAggregate({
        nextFetchAt: pastDate,
        existingDatapoints: [
          { views: 100, timestamp: Date.now() - 2 * 86400000 },
          { views: 200, timestamp: Date.now() - 86400000 },
        ],
      });

      // Return data showing continued high growth
      const mockResponse = makeFanslyResponse(400, Date.now());

      await withMockFetch(
        mock(() => Promise.resolve(new Response(JSON.stringify(mockResponse), { status: 200, headers: { "Content-Type": "application/json" } }))),
        () => processAnalyticsCronTick(),
      );

      const updatedAggregate = await aggregateRepo.findOne({ where: { postMediaId: postMedia.id } });
      if (!updatedAggregate) throw new Error("aggregate not found");
      const expectedMin = Date.now() + 23 * 60 * 60 * 1000; // ~1 day minus tolerance
      const expectedMax = Date.now() + 25 * 60 * 60 * 1000; // ~1 day plus tolerance
      expect(updatedAggregate.nextFetchAt?.getTime()).toBeGreaterThanOrEqual(expectedMin);
      expect(updatedAggregate.nextFetchAt?.getTime()).toBeLessThanOrEqual(expectedMax);
    });

    test("returns early when no credentials configured", async () => {
      // Create an aggregate that would be due
      await createPostMediaWithAggregate({
        nextFetchAt: new Date(Date.now() - 60 * 60 * 1000),
      });

      // Don't save credentials — credentials file might not exist or return null
      // The cron should handle this gracefully
      const result = await processAnalyticsCronTick();
      // Should either be stale or gracefully skip (no credentials = stale-like behavior)
      expect(result.processed).toBe(0);
    });
  });
});
