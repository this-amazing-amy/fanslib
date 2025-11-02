import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { Elysia } from "elysia";
import "reflect-metadata";
import { getTestDataSource, resetAllFixtures, setupTestDatabase, teardownTestDatabase } from "../../lib/db.test";
import { serializeJson } from "../../lib/serialize-json";
import { Media } from "./entity";
import { MEDIA_FIXTURES } from "./fixtures";
import { libraryRoutes } from "./routes";

describe("Library Routes", () => {
  // eslint-disable-next-line functional/no-let
  let app: Elysia;

  beforeAll(async () => {
    await setupTestDatabase();
    await resetAllFixtures();
    app = new Elysia().mapResponse(serializeJson).use(libraryRoutes);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await resetAllFixtures();
  });

  describe("GET /api/media", () => {
    test("returns all media", async () => {
      const response = await app.handle(new Request("http://localhost/api/media"));
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data.items)).toBe(true);
      expect(data.items.length).toBeGreaterThanOrEqual(MEDIA_FIXTURES.length);
      
      MEDIA_FIXTURES.forEach((fixture) => {
        const media = data.items.find((m: Media) => m.id === fixture.id);
        expect(media).toBeDefined();
        expect(media?.name).toBe(fixture.name);
        expect(media?.type).toBe(fixture.type);
      });
    });

    test("supports pagination", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/media?page=1&limit=2")
      );
      const data = await response.json();

      expect(data.items).toHaveLength(2);
      expect(data.total).toBeGreaterThanOrEqual(MEDIA_FIXTURES.length);
      expect(data.page).toBe(1);
      expect(data.limit).toBe(2);
    });
  });

  describe("GET /api/media/:id", () => {
    test("returns media by id", async () => {
      const fixtureMedia = MEDIA_FIXTURES[0];
      if (!fixtureMedia) {
        throw new Error("No media fixtures available");
      }

      const response = await app.handle(
        new Request(`http://localhost/api/media/${fixtureMedia.id}`)
      );
      expect(response.status).toBe(200);

      const data = await response.json() as Media;
      expect(data.id).toBe(fixtureMedia.id);
      expect(data.name).toBe(fixtureMedia.name);
    });

    test("returns error for non-existent media", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/media/non-existent-id")
      );

      const data = await response.json();
      expect(data).toHaveProperty("error");
      expect(data.error).toBe("Media not found");
    });
  });

  describe("PATCH /api/media/:id", () => {
    test("updates media metadata", async () => {
      const fixtureMedia = MEDIA_FIXTURES[0];
      if (!fixtureMedia) {
        throw new Error("No media fixtures available");
      }

      const updateData = {
        redgifsUrl: "https://redgifs.com/watch/example",
      };

      const response = await app.handle(
        new Request(`http://localhost/api/media/${fixtureMedia.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        })
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.redgifsUrl).toBe("https://redgifs.com/watch/example");
      expect(data.id).toBe(fixtureMedia.id);
    });

    test("returns error for non-existent media", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/media/non-existent-id", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ redgifsUrl: "https://example.com" }),
        })
      );

      const data = await response.json();
      expect(data).toHaveProperty("error");
      expect(data.error).toBe("Media not found");
    });
  });

  describe("DELETE /api/media/:id", () => {
    test("deletes media record", async () => {
      const fixtureMedia = MEDIA_FIXTURES[MEDIA_FIXTURES.length - 1];
      if (!fixtureMedia) {
        throw new Error("No media fixtures available");
      }

      const response = await app.handle(
        new Request(`http://localhost/api/media/${fixtureMedia.id}`, {
          method: "DELETE",
        })
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);

      const dataSource = getTestDataSource();
      const repository = dataSource.getRepository(Media);
      const deletedMedia = await repository.findOne({ where: { id: fixtureMedia.id } });
      expect(deletedMedia).toBeNull();
    });
  });

  describe("GET /api/media/:id/adjacent", () => {
    test("returns adjacent media", async () => {
      const fixtureMedia = MEDIA_FIXTURES[1];
      if (!fixtureMedia) {
        throw new Error("No media fixtures available");
      }

      const response = await app.handle(
        new Request(`http://localhost/api/media/${fixtureMedia.id}/adjacent`)
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty("previous");
      expect(data).toHaveProperty("next");
    });
  });

});

