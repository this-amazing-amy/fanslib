import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { Hono } from "hono";
import "reflect-metadata";
import { getTestDataSource, resetAllFixtures, setupTestDatabase, teardownTestDatabase } from "../../lib/db.test";
import { devalueMiddleware } from "../../lib/devalue-middleware";
import { parseResponse } from "../../test-utils/setup";
import { Media } from "./entity";
import { MEDIA_FIXTURES } from "./fixtures";
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
      });
      expect(response.status).toBe(200);

      const data = await parseResponse<{ items: Media[]; total: number; page: number; limit: number }>(response);
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
      const data = await parseResponse<{ items: Media[]; total: number; page: number; limit: number }>(response);

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

      const response = await app.request(`/api/media/by-path/${encodeURIComponent(fixtureMedia.relativePath)}`);
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

});

