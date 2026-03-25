import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { Hono } from "hono";
import "reflect-metadata";
import { getTestDataSource, setupTestDatabase, teardownTestDatabase } from "../../lib/test-db";
import { devalueMiddleware } from "../../lib/devalue-middleware";
import { parseResponse, createTestMedia } from "../../test-utils/setup";
import { Media } from "./entity";
import { Shoot } from "../shoots/entity";
import { libraryRoutes } from "./routes";

describe("GET /api/media/:mediaId/siblings", () => {
  // eslint-disable-next-line functional/no-let
  let app: Hono;

  beforeAll(async () => {
    await setupTestDatabase();
    app = new Hono().use("*", devalueMiddleware()).route("/", libraryRoutes);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    const ds = getTestDataSource();
    // Clear shoot_media join table first, then shoots and media
    await ds.query("DELETE FROM shoot_media");
    await ds.getRepository(Shoot).clear();
    await ds.getRepository(Media).clear();
  });

  test("returns media with same shoot and package, excluding self", async () => {
    const ds = getTestDataSource();
    const shootRepo = ds.getRepository(Shoot);

    const mediaA = await createTestMedia({ id: "a", package: "main", role: "content" });
    const mediaB = await createTestMedia({ id: "b", package: "main", role: "preview" });
    const mediaC = await createTestMedia({ id: "c", package: "main", role: "thumbnail" });

    const shoot = shootRepo.create({
      id: "shoot-1",
      name: "Test Shoot",
      shootDate: new Date(),
      media: [mediaA, mediaB, mediaC],
    });
    await shootRepo.save(shoot);

    const response = await app.request("/api/media/a/siblings");
    expect(response.status).toBe(200);

    const data = await parseResponse<Media[]>(response);
    expect(data).toHaveLength(2);

    const ids = data?.map((m) => m.id).sort();
    expect(ids).toEqual(["b", "c"]);
  });

  test("excludes media in same shoot but different package", async () => {
    const ds = getTestDataSource();
    const shootRepo = ds.getRepository(Shoot);

    const mediaA = await createTestMedia({ id: "pkg-a", package: "main" });
    const mediaB = await createTestMedia({ id: "pkg-b", package: "main" });
    const mediaC = await createTestMedia({ id: "pkg-c", package: "bonus" });

    const shoot = shootRepo.create({
      id: "shoot-mix",
      name: "Mixed Packages",
      shootDate: new Date(),
      media: [mediaA, mediaB, mediaC],
    });
    await shootRepo.save(shoot);

    const response = await app.request("/api/media/pkg-a/siblings");
    expect(response.status).toBe(200);

    const data = await parseResponse<Media[]>(response);
    expect(data).toHaveLength(1);
    expect(data?.[0]?.id).toBe("pkg-b");
  });

  test("response includes standard media fields", async () => {
    const ds = getTestDataSource();
    const shootRepo = ds.getRepository(Shoot);

    const mediaA = await createTestMedia({ id: "shape-a", package: "main", contentRating: "uc", role: "content" });
    const mediaB = await createTestMedia({ id: "shape-b", package: "main", role: "preview" });

    const shoot = shootRepo.create({
      id: "shoot-shape",
      name: "Shape Test",
      shootDate: new Date(),
      media: [mediaA, mediaB],
    });
    await shootRepo.save(shoot);

    const response = await app.request("/api/media/shape-a/siblings");
    const data = await parseResponse<Media[]>(response);
    const sibling = data?.[0];

    expect(sibling).toBeDefined();
    expect(sibling).toHaveProperty("id");
    expect(sibling).toHaveProperty("name");
    expect(sibling).toHaveProperty("type");
    expect(sibling).toHaveProperty("size");
    expect(sibling).toHaveProperty("relativePath");
    expect(sibling).toHaveProperty("package");
    expect(sibling).toHaveProperty("role");
    expect(sibling).toHaveProperty("contentRating");
  });

  test("excludes media in same package but different shoot", async () => {
    const ds = getTestDataSource();
    const shootRepo = ds.getRepository(Shoot);

    const mediaA = await createTestMedia({ id: "s1-a", package: "main" });
    const mediaB = await createTestMedia({ id: "s1-b", package: "main" });
    const mediaC = await createTestMedia({ id: "s2-c", package: "main" });

    const shoot1 = shootRepo.create({
      id: "shoot-s1",
      name: "Shoot 1",
      shootDate: new Date(),
      media: [mediaA, mediaB],
    });
    const shoot2 = shootRepo.create({
      id: "shoot-s2",
      name: "Shoot 2",
      shootDate: new Date(),
      media: [mediaC],
    });
    await shootRepo.save(shoot1);
    await shootRepo.save(shoot2);

    const response = await app.request("/api/media/s1-a/siblings");
    expect(response.status).toBe(200);

    const data = await parseResponse<Media[]>(response);
    expect(data).toHaveLength(1);
    expect(data?.[0]?.id).toBe("s1-b");
  });

  test("returns 404 when media does not exist", async () => {
    const response = await app.request("/api/media/nonexistent/siblings");
    expect(response.status).toBe(404);

    const data = await parseResponse<{ error: string }>(response);
    expect(data?.error).toBe("Media not found");
  });

  test("returns empty array when media has no package", async () => {
    const ds = getTestDataSource();
    const shootRepo = ds.getRepository(Shoot);

    const media = await createTestMedia({ id: "no-pkg" });
    const shoot = shootRepo.create({
      id: "shoot-pkg",
      name: "Shoot",
      shootDate: new Date(),
      media: [media],
    });
    await shootRepo.save(shoot);

    const response = await app.request("/api/media/no-pkg/siblings");
    expect(response.status).toBe(200);

    const data = await parseResponse<Media[]>(response);
    expect(data).toEqual([]);
  });

  test("returns empty array when media has no shoot", async () => {
    await createTestMedia({ id: "no-shoot", package: "main" });

    const response = await app.request("/api/media/no-shoot/siblings");
    expect(response.status).toBe(200);

    const data = await parseResponse<Media[]>(response);
    expect(data).toEqual([]);
  });
});
