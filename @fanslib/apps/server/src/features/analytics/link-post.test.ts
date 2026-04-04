import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { Hono } from "hono";
import "reflect-metadata";
import { setupTestDatabase, teardownTestDatabase, getTestDataSource } from "../../lib/test-db";
import { resetAllFixtures } from "../../lib/test-fixtures";
import { devalueMiddleware } from "../../lib/devalue-middleware";
import {
  parseResponse,
  createTestMedia,
  createTestPost,
  createTestChannel,
} from "../../test-utils/setup";
import { PostMedia } from "../posts/entity";
import { FanslyAnalyticsAggregate } from "./entity";
import { analyticsRoutes } from "./routes";

describe("POST /api/analytics/link-post", () => {
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

  test("links preview PostMedia to fanslyStatisticsId by duration match", async () => {
    const dataSource = getTestDataSource();
    const postMediaRepo = dataSource.getRepository(PostMedia);

    const channel = await createTestChannel({ typeId: "fansly" });
    const media = await createTestMedia({ type: "video", duration: 30 });
    const post = await createTestPost(channel.id, { status: "posted" });

    const pm = postMediaRepo.create({ post, media, order: 0 });
    await postMediaRepo.save(pm);

    const response = await app.request("/api/analytics/link-post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId: post.id,
        attachments: [{ fanslyStatisticsId: "stats-123", duration: 30 }],
      }),
    });

    expect(response.status).toBe(200);

    const data = await parseResponse<{ success: boolean; linkedPostMediaId: string }>(response);
    expect(data?.success).toBe(true);
    expect(data?.linkedPostMediaId).toBe(pm.id);

    // Verify fanslyStatisticsId was set
    const updated = await postMediaRepo.findOne({ where: { id: pm.id } });
    expect(updated?.fanslyStatisticsId).toBe("stats-123");
  });

  test("creates FanslyAnalyticsAggregate with nextFetchAt for immediate tracking", async () => {
    const dataSource = getTestDataSource();
    const postMediaRepo = dataSource.getRepository(PostMedia);
    const aggregateRepo = dataSource.getRepository(FanslyAnalyticsAggregate);

    const channel = await createTestChannel({ typeId: "fansly" });
    const media = await createTestMedia({ type: "video", duration: 45 });
    const post = await createTestPost(channel.id, { status: "posted" });

    const pm = postMediaRepo.create({ post, media, order: 0 });
    await postMediaRepo.save(pm);

    await app.request("/api/analytics/link-post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId: post.id,
        attachments: [{ fanslyStatisticsId: "stats-456", duration: 45 }],
      }),
    });

    const aggregate = await aggregateRepo.findOne({ where: { postMediaId: pm.id } });
    expect(aggregate).not.toBeNull();
    expect(aggregate?.nextFetchAt).not.toBeNull();
  });

  test("returns 404 for non-existent post", async () => {
    const response = await app.request("/api/analytics/link-post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId: "non-existent-post",
        attachments: [{ fanslyStatisticsId: "stats-1", duration: 10 }],
      }),
    });

    expect(response.status).toBe(404);
  });

  test("returns 422 when no duration match found", async () => {
    const dataSource = getTestDataSource();
    const postMediaRepo = dataSource.getRepository(PostMedia);

    const channel = await createTestChannel({ typeId: "fansly" });
    const media = await createTestMedia({ type: "video", duration: 30 });
    const post = await createTestPost(channel.id, { status: "posted" });

    const pm = postMediaRepo.create({ post, media, order: 0 });
    await postMediaRepo.save(pm);

    const response = await app.request("/api/analytics/link-post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId: post.id,
        attachments: [{ fanslyStatisticsId: "stats-wrong", duration: 999 }],
      }),
    });

    expect(response.status).toBe(422);
  });
});
