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
import { analyticsRoutes } from "./routes";

describe("GET /api/analytics/unlinked-posts", () => {
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

  test("returns posted Fansly posts where preview PostMedia has no fanslyStatisticsId", async () => {
    const dataSource = getTestDataSource();
    const postMediaRepo = dataSource.getRepository(PostMedia);

    const channel = await createTestChannel({ typeId: "fansly" });
    const media = await createTestMedia({ type: "video", duration: 30 });
    const post = await createTestPost(channel.id, {
      status: "posted",
      caption: "Test unlinked post",
    });

    // Create PostMedia without fanslyStatisticsId (unlinked)
    const pm = postMediaRepo.create({
      post,
      media,
      order: 0,
      fanslyStatisticsId: null,
    });
    await postMediaRepo.save(pm);

    const response = await app.request("/api/analytics/unlinked-posts");
    expect(response.status).toBe(200);

    const data = await parseResponse<{
      posts: { postId: string; caption: string }[];
      total: number;
    }>(response);

    expect(data?.total).toBeGreaterThanOrEqual(1);
    expect(data?.posts.some((p) => p.postId === post.id)).toBe(true);
  });

  test("excludes posts where preview PostMedia already has fanslyStatisticsId", async () => {
    const dataSource = getTestDataSource();
    const postMediaRepo = dataSource.getRepository(PostMedia);

    const channel = await createTestChannel({ typeId: "fansly" });
    const media = await createTestMedia({ type: "video", duration: 10 });
    const post = await createTestPost(channel.id, { status: "posted" });

    // Create PostMedia WITH fanslyStatisticsId (linked)
    const pm = postMediaRepo.create({
      post,
      media,
      order: 0,
      fanslyStatisticsId: "some-stats-id",
    });
    await postMediaRepo.save(pm);

    const response = await app.request("/api/analytics/unlinked-posts");
    const data = await parseResponse<{ posts: { postId: string }[]; total: number }>(response);

    expect(data?.posts.every((p) => p.postId !== post.id)).toBe(true);
  });

  test("excludes non-posted posts", async () => {
    const dataSource = getTestDataSource();
    const postMediaRepo = dataSource.getRepository(PostMedia);

    const channel = await createTestChannel({ typeId: "fansly" });
    const media = await createTestMedia();
    const draftPost = await createTestPost(channel.id, { status: "draft" });

    const pm = postMediaRepo.create({
      post: draftPost,
      media,
      order: 0,
      fanslyStatisticsId: null,
    });
    await postMediaRepo.save(pm);

    const response = await app.request("/api/analytics/unlinked-posts");
    const data = await parseResponse<{ posts: { postId: string }[]; total: number }>(response);

    expect(data?.posts.every((p) => p.postId !== draftPost.id)).toBe(true);
  });

  test("excludes non-Fansly channel posts", async () => {
    const dataSource = getTestDataSource();
    const postMediaRepo = dataSource.getRepository(PostMedia);
    const channelTypeRepo = dataSource.getRepository("ChannelType");

    // Create a non-Fansly channel type
    const existingType = await channelTypeRepo.findOne({ where: { id: "bluesky" } });
    if (!existingType) {
      await channelTypeRepo.save({ id: "bluesky", name: "Bluesky" });
    }

    const nonFanslyChannel = await createTestChannel({
      typeId: "bluesky",
      name: "Bluesky Channel",
    });
    const media = await createTestMedia();
    const post = await createTestPost(nonFanslyChannel.id, { status: "posted" });

    const pm = postMediaRepo.create({
      post,
      media,
      order: 0,
      fanslyStatisticsId: null,
    });
    await postMediaRepo.save(pm);

    const response = await app.request("/api/analytics/unlinked-posts");
    const data = await parseResponse<{ posts: { postId: string }[]; total: number }>(response);

    expect(data?.posts.every((p) => p.postId !== post.id)).toBe(true);
  });

  test("returns empty when no unlinked posts exist", async () => {
    const response = await app.request("/api/analytics/unlinked-posts");
    expect(response.status).toBe(200);

    const data = await parseResponse<{ posts: unknown[]; total: number }>(response);
    expect(data?.total).toBe(0);
    expect(data?.posts).toHaveLength(0);
  });
});
