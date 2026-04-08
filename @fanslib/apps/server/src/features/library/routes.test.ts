import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { Hono } from "hono";
import { existsSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import "reflect-metadata";
import { getTestDataSource, setupTestDatabase, teardownTestDatabase } from "../../lib/test-db";
import { resetAllFixtures } from "../../lib/test-fixtures";
import { devalueMiddleware } from "../../lib/devalue-middleware";
import { parseResponse } from "../../test-utils/setup";
import { Composition } from "../compositions/entity";
import { Shoot } from "../shoots/entity";
import { Media } from "./entity";
import { MEDIA_FIXTURES } from "./fixtures-data";
import { libraryRoutes } from "./routes";

describe("Library Routes", () => {
  // eslint-disable-next-line functional/no-let
  let app: Hono;

  beforeAll(async () => {
    await setupTestDatabase();
    await resetAllFixtures();
    app = new Hono().use("*", devalueMiddleware()).route("/", libraryRoutes);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await resetAllFixtures();
  });

  describe("POST /api/media/all", () => {
    test("returns all media", async () => {
      const response = await app.request("/api/media/all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(response.status).toBe(200);

      const data = await parseResponse<{
        items: Media[];
        total: number;
        page: number;
        limit: number;
      }>(response);
      expect(Array.isArray(data?.items)).toBe(true);
      expect(data?.items.length).toBeGreaterThanOrEqual(MEDIA_FIXTURES.length);

      MEDIA_FIXTURES.forEach((fixture) => {
        const media = data?.items.find((m: Media) => m.id === fixture.id);
        expect(media).toBeDefined();
        expect(media?.name).toBe(fixture.name);
        expect(media?.type).toBe(fixture.type);
      });
    });

    test("supports pagination", async () => {
      const response = await app.request("/api/media/all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page: 1,
          limit: 2,
        }),
      });
      const data = await parseResponse<{
        items: Media[];
        total: number;
        page: number;
        limit: number;
      }>(response);

      expect(data?.items).toHaveLength(2);
      expect(data?.total).toBeGreaterThanOrEqual(MEDIA_FIXTURES.length);
      expect(data?.page).toBe(1);
      expect(data?.limit).toBe(2);
    });
  });

  describe("GET /api/media/by-id/:id", () => {
    test("returns media by id", async () => {
      const fixtureMedia = MEDIA_FIXTURES[0];
      if (!fixtureMedia) {
        throw new Error("No media fixtures available");
      }

      const response = await app.request(`/api/media/by-id/${fixtureMedia.id}`);

      expect(response.status).toBe(200);

      const data = await parseResponse<Media>(response);
      expect(data?.id).toBe(fixtureMedia.id);
      expect(data?.name).toBe(fixtureMedia.name);
    });

    test("returns error for non-existent media", async () => {
      const response = await app.request("/api/media/by-id/non-existent-id");

      expect(response.status).toBe(404);
      const data = await parseResponse<{ error: string }>(response);
      expect(data).toHaveProperty("error");
      expect(data?.error).toBe("Media not found");
    });
  });

  describe("GET /api/media/by-path/:path", () => {
    test("returns media by path", async () => {
      const fixtureMedia = MEDIA_FIXTURES[0];
      if (!fixtureMedia) {
        throw new Error("No media fixtures available");
      }

      const response = await app.request(
        `/api/media/by-path/${encodeURIComponent(fixtureMedia.relativePath)}`,
      );
      expect(response.status).toBe(200);
      const data = await parseResponse<Media>(response);
      expect(data?.id).toBe(fixtureMedia.id);
      expect(data?.name).toBe(fixtureMedia.name);
    });

    test("returns error for non-existent media", async () => {
      const response = await app.request("/api/media/by-path/non-existent-path");
      expect(response.status).toBe(404);
      const data = await parseResponse<{ error: string }>(response);
      expect(data).toHaveProperty("error");
      expect(data?.error).toBe("Media not found");
    });
  });

  describe("PATCH /api/media/by-id/:id", () => {
    test("updates media metadata", async () => {
      const fixtureMedia = MEDIA_FIXTURES[0];
      if (!fixtureMedia) {
        throw new Error("No media fixtures available");
      }

      const updateData = {
        redgifsUrl: "https://redgifs.com/watch/example",
      };

      const response = await app.request(`/api/media/by-id/${fixtureMedia.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      expect(response.status).toBe(200);

      const data = await parseResponse<Media>(response);
      expect(data?.redgifsUrl).toBe("https://redgifs.com/watch/example");
      expect(data?.id).toBe(fixtureMedia.id);
    });

    test("returns error for non-existent media", async () => {
      const response = await app.request("/api/media/by-id/non-existent-id", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ redgifsUrl: "https://example.com" }),
      });

      const data = await parseResponse<{ error: string }>(response);
      expect(data).toHaveProperty("error");
      expect(data?.error).toBe("Media not found");
    });
  });

  describe("DELETE /api/media/by-id/:id", () => {
    test("deletes media record", async () => {
      const fixtureMedia = MEDIA_FIXTURES[MEDIA_FIXTURES.length - 1];
      if (!fixtureMedia) {
        throw new Error("No media fixtures available");
      }

      const response = await app.request(`/api/media/by-id/${fixtureMedia.id}`, {
        method: "DELETE",
      });
      expect(response.status).toBe(200);

      const data = await parseResponse<{ success: boolean }>(response);
      expect(data?.success).toBe(true);

      const dataSource = getTestDataSource();
      const repository = dataSource.getRepository(Media);
      const deletedMedia = await repository.findOne({ where: { id: fixtureMedia.id } });
      expect(deletedMedia).toBeNull();
    });

    test("returns 404 when media not found", async () => {
      const response = await app.request("/api/media/by-id/non-existent-id", {
        method: "DELETE",
      });
      expect(response.status).toBe(404);

      const data = await parseResponse<{ error: string }>(response);
      expect(data?.error).toBe("Media not found");
    });
  });

  describe("PATCH /api/media/by-id/:id — excluded flag", () => {
    test("sets excluded to true", async () => {
      const fixtureMedia = MEDIA_FIXTURES[0];
      if (!fixtureMedia) throw new Error("No media fixtures available");

      const response = await app.request(`/api/media/by-id/${fixtureMedia.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ excluded: true }),
      });
      expect(response.status).toBe(200);

      const data = await parseResponse<Media>(response);
      expect(data?.excluded).toBe(true);
    });

    test("sets excluded to false", async () => {
      const fixtureMedia = MEDIA_FIXTURES[0];
      if (!fixtureMedia) throw new Error("No media fixtures available");

      // First set to true
      await app.request(`/api/media/by-id/${fixtureMedia.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ excluded: true }),
      });

      // Then set back to false
      const response = await app.request(`/api/media/by-id/${fixtureMedia.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ excluded: false }),
      });
      expect(response.status).toBe(200);

      const data = await parseResponse<Media>(response);
      expect(data?.excluded).toBe(false);
    });

    test("defaults excluded to false on new media", async () => {
      const fixtureMedia = MEDIA_FIXTURES[0];
      if (!fixtureMedia) throw new Error("No media fixtures available");

      const response = await app.request(`/api/media/by-id/${fixtureMedia.id}`);
      expect(response.status).toBe(200);

      const data = await parseResponse<Media>(response);
      expect(data?.excluded).toBe(false);
    });
  });

  describe("new fields in API responses", () => {
    test("GET by-id returns new fields with defaults for existing media", async () => {
      const fixtureMedia = MEDIA_FIXTURES[0];
      if (!fixtureMedia) throw new Error("No media fixtures available");

      const response = await app.request(`/api/media/by-id/${fixtureMedia.id}`);
      expect(response.status).toBe(200);

      const data = await parseResponse<Media>(response);
      expect(data?.contentRating).toBeNull();
      expect(data?.package).toBeNull();
      expect(data?.role).toBeNull();
      expect(data?.isManaged).toBe(false);
    });

    test("POST all returns new fields with defaults for existing media", async () => {
      const response = await app.request("/api/media/all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(response.status).toBe(200);

      const data = await parseResponse<{ items: Media[] }>(response);
      const media = data?.items[0];
      expect(media).toBeDefined();
      expect(media?.contentRating).toBeNull();
      expect(media?.package).toBeNull();
      expect(media?.role).toBeNull();
      expect(media?.isManaged).toBe(false);
    });

    test("PATCH can set contentRating on media", async () => {
      const fixtureMedia = MEDIA_FIXTURES[0];
      if (!fixtureMedia) throw new Error("No media fixtures available");

      const response = await app.request(`/api/media/by-id/${fixtureMedia.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentRating: "uc" }),
      });
      expect(response.status).toBe(200);

      const data = await parseResponse<Media>(response);
      expect(data?.contentRating).toBe("uc");
    });

    test("PATCH can set package and role on media", async () => {
      const fixtureMedia = MEDIA_FIXTURES[0];
      if (!fixtureMedia) throw new Error("No media fixtures available");

      const response = await app.request(`/api/media/by-id/${fixtureMedia.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package: "main", role: "content" }),
      });
      expect(response.status).toBe(200);

      const data = await parseResponse<Media>(response);
      expect(data?.package).toBe("main");
      expect(data?.role).toBe("content");
    });

    test("PATCH can set isManaged on media", async () => {
      const fixtureMedia = MEDIA_FIXTURES[0];
      if (!fixtureMedia) throw new Error("No media fixtures available");

      const response = await app.request(`/api/media/by-id/${fixtureMedia.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isManaged: true }),
      });
      expect(response.status).toBe(200);

      const data = await parseResponse<Media>(response);
      expect(data?.isManaged).toBe(true);
    });

    test("PATCH rejects invalid contentRating code", async () => {
      const fixtureMedia = MEDIA_FIXTURES[0];
      if (!fixtureMedia) throw new Error("No media fixtures available");

      const response = await app.request(`/api/media/by-id/${fixtureMedia.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentRating: "invalid" }),
      });
      expect(response.status).toBe(422);
    });
  });

  describe("POST /api/media/by-id/:id/adjacent", () => {
    test("returns adjacent media", async () => {
      const fixtureMedia = MEDIA_FIXTURES[1];
      if (!fixtureMedia) {
        throw new Error("No media fixtures available");
      }

      const response = await app.request(`/api/media/by-id/${fixtureMedia.id}/adjacent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(response.status).toBe(200);

      const data = await parseResponse<{ previous: Media | null; next: Media | null }>(response);
      expect(data).toHaveProperty("previous");
      expect(data).toHaveProperty("next");
    });
  });

  describe("Category defaults", () => {
    test("existing media has category 'library' by default", async () => {
      const fixtureMedia = MEDIA_FIXTURES[0];
      if (!fixtureMedia) throw new Error("No fixtures");

      const response = await app.request(`/api/media/by-id/${fixtureMedia.id}`);
      expect(response.status).toBe(200);

      const data = await parseResponse<{ category: string }>(response);
      expect(data?.category).toBe("library");
    });
  });

  describe("Footage upload", () => {
    const TEST_MEDIA_DIR = join(import.meta.dir, "..", "..", "..", "tests", "fixtures", "test-media");

    beforeEach(() => {
      process.env.MEDIA_PATH = TEST_MEDIA_DIR;
      if (existsSync(TEST_MEDIA_DIR)) rmSync(TEST_MEDIA_DIR, { recursive: true, force: true });
      mkdirSync(TEST_MEDIA_DIR, { recursive: true });
    });

    afterAll(() => {
      if (existsSync(TEST_MEDIA_DIR)) rmSync(TEST_MEDIA_DIR, { recursive: true, force: true });
    });

    test("uploads footage with category 'footage' and note", async () => {
      // Create a shoot
      const dataSource = getTestDataSource();
      const shootRepo = dataSource.getRepository(Shoot);
      const shoot = await shootRepo.save(
        shootRepo.create({ name: "Footage Shoot", shootDate: new Date("2026-04-08") }),
      );

      const formData = new FormData();
      formData.append("shootId", shoot.id);
      formData.append("file", new Blob(["fake video"], { type: "video/mp4" }), "promo-clip.mp4");
      formData.append("category", "footage");
      formData.append("note", "Color-graded A-roll");

      const response = await app.request("/api/media/upload", {
        method: "POST",
        body: formData,
      });
      expect(response.status).toBe(200);

      const data = await parseResponse<{
        id: string;
        category: string;
        note: string | null;
      }>(response);

      expect(data?.category).toBe("footage");
      expect(data?.note).toBe("Color-graded A-roll");
    });

    test("footage is stored in footage/ directory, not shoots/", async () => {
      const dataSource = getTestDataSource();
      const shootRepo = dataSource.getRepository(Shoot);
      const shoot = await shootRepo.save(
        shootRepo.create({ name: "Dir Test", shootDate: new Date("2026-04-08") }),
      );

      const formData = new FormData();
      formData.append("shootId", shoot.id);
      formData.append("file", new Blob(["fake"], { type: "video/mp4" }), "clip.mp4");
      formData.append("category", "footage");

      const response = await app.request("/api/media/upload", {
        method: "POST",
        body: formData,
      });
      const data = await parseResponse<{ relativePath: string }>(response);

      expect(data?.relativePath).toMatch(/^footage\//);
      expect(data?.relativePath).not.toMatch(/^shoots\//);
    });

    test("warns when deleting footage referenced by a composition", async () => {
      const dataSource = getTestDataSource();
      const shootRepo = dataSource.getRepository(Shoot);
      const shoot = await shootRepo.save(
        shootRepo.create({ name: "Warn Shoot", shootDate: new Date("2026-04-08") }),
      );

      // Upload footage
      const formData = new FormData();
      formData.append("shootId", shoot.id);
      formData.append("file", new Blob(["fake"], { type: "video/mp4" }), "ref.mp4");
      formData.append("category", "footage");
      const uploadResponse = await app.request("/api/media/upload", {
        method: "POST",
        body: formData,
      });
      const footage = await parseResponse<{ id: string }>(uploadResponse);

      // Create a composition referencing this footage in a segment
      const compRepo = dataSource.getRepository(Composition);
      await compRepo.save(
        compRepo.create({
          shootId: shoot.id,
          name: "Uses Footage",
          segments: [{ id: "seg-1", sourceMediaId: footage?.id, sourceStartFrame: 0, sourceEndFrame: 900 }],
          tracks: [],
          exportRegions: [],
        }),
      );

      // Try to delete — should get a warning
      const deleteResponse = await app.request(`/api/media/by-id/${footage?.id}`, {
        method: "DELETE",
      });
      expect(deleteResponse.status).toBe(409);

      const data = await parseResponse<{ error: string; compositionIds: string[] }>(deleteResponse);
      expect(data?.error).toContain("referenced");
      expect(data?.compositionIds).toHaveLength(1);
    });

    test("library upload still uses shoots/ directory", async () => {
      const dataSource = getTestDataSource();
      const shootRepo = dataSource.getRepository(Shoot);
      const shoot = await shootRepo.save(
        shootRepo.create({ name: "Lib Test", shootDate: new Date("2026-04-08") }),
      );

      const formData = new FormData();
      formData.append("shootId", shoot.id);
      formData.append("file", new Blob(["fake"], { type: "video/mp4" }), "clip.mp4");

      const response = await app.request("/api/media/upload", {
        method: "POST",
        body: formData,
      });
      const data = await parseResponse<{ relativePath: string }>(response);

      expect(data?.relativePath).toMatch(/^shoots\//);
    });
  });
});
