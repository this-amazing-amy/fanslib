import type { Hashtag } from "@fanslib/types";
import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { Elysia } from "elysia";
import "reflect-metadata";
import { getTestDataSource, resetAllFixtures, setupTestDatabase, teardownTestDatabase } from "../../lib/db.test";
import { serializeJson } from "../../lib/serialize-json";
import { Hashtag as HashtagEntity } from "./entity";
import { HASHTAG_FIXTURES } from "./fixtures";
import { normalizeHashtagName } from "./operations/hashtag/helpers";
import { hashtagsRoutes } from "./routes";

describe("Hashtags Routes", () => {
  // eslint-disable-next-line functional/no-let
  let app: Elysia;
  // eslint-disable-next-line functional/no-let
  let fixtures: Awaited<ReturnType<typeof resetAllFixtures>>;

  beforeAll(async () => {
    await setupTestDatabase();
    fixtures = await resetAllFixtures();
    app = new Elysia().mapResponse(serializeJson).use(hashtagsRoutes);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    fixtures = await resetAllFixtures();
  });

  describe("GET /api/hashtags", () => {
    test("returns all hashtags", async () => {
      const response = await app.handle(new Request("http://localhost/api/hashtags"));
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(HASHTAG_FIXTURES.length);
      
      HASHTAG_FIXTURES.forEach((fixture) => {
        const normalizedName = normalizeHashtagName(fixture.name);
        const hashtag = data.find((h: Hashtag) => h.name === normalizedName);
        expect(hashtag).toBeDefined();
        expect(hashtag?.name).toBe(normalizedName);
      });
    });
  });

  describe("GET /api/hashtags/:id", () => {
    test("returns hashtag by id", async () => {
      const fixtureHashtag = fixtures.hashtags.hashtags[0];
      if (!fixtureHashtag) {
        throw new Error("No hashtag fixtures available");
      }

      const response = await app.handle(
        new Request(`http://localhost/api/hashtags/${fixtureHashtag.id}`)
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.id).toBe(fixtureHashtag.id);
      expect(data.name).toBe(fixtureHashtag.name);
    });

    test("returns error for non-existent hashtag", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/hashtags/999999")
      );

      const data = await response.json();
      expect(data).toHaveProperty("error");
      expect(data.error).toBe("Hashtag not found");
    });
  });

  describe("POST /api/hashtags", () => {
    test("creates a new hashtag", async () => {
      const hashtagData = {
        name: "newhash",
      };

      const response = await app.handle(
        new Request("http://localhost/api/hashtags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(hashtagData),
        })
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.name).toBe("#newhash");
    });

    test("returns existing hashtag if name already exists", async () => {
      const existing = fixtures.hashtags.hashtags[0];
      if (!existing) {
        throw new Error("No hashtag fixtures available");
      }

      const response = await app.handle(
        new Request("http://localhost/api/hashtags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: existing.name }),
        })
      );

      const data = await response.json();
      expect(data.id).toBe(existing.id);
      expect(data.name).toBe(existing.name);
    });
  });

  describe("POST /api/hashtags/batch", () => {
    test("creates multiple hashtags", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/hashtags/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ names: ["hash1", "hash2", "hash3"] }),
        })
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveLength(3);
      expect(data[0].name).toBe("#hash1");
      expect(data[1].name).toBe("#hash2");
      expect(data[2].name).toBe("#hash3");
    });

    test("handles mix of new and existing hashtags", async () => {
      const existing = fixtures.hashtags.hashtags[0];
      if (!existing) {
        throw new Error("No hashtag fixtures available");
      }

      const response = await app.handle(
        new Request("http://localhost/api/hashtags/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ names: [existing.name, "#newhash"] }),
        })
      );

      const data = await response.json();
      expect(data).toHaveLength(2);
    });
  });

  describe("DELETE /api/hashtags/:id", () => {
    test("deletes hashtag", async () => {
      const fixtureHashtag = fixtures.hashtags.hashtags[fixtures.hashtags.hashtags.length - 1];
      if (!fixtureHashtag) {
        throw new Error("No hashtag fixtures available");
      }

      const response = await app.handle(
        new Request(`http://localhost/api/hashtags/${fixtureHashtag.id}`, {
          method: "DELETE",
        })
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);

      const dataSource = getTestDataSource();
      const repository = dataSource.getRepository(HashtagEntity);
      const deletedHashtag = await repository.findOne({ where: { id: fixtureHashtag.id } });
      expect(deletedHashtag).toBeNull();
    });
  });

  describe("GET /api/hashtags/:id/stats", () => {
    test("returns hashtag stats", async () => {
      const fixtureHashtag = fixtures.hashtags.hashtags[0];
      if (!fixtureHashtag) {
        throw new Error("No hashtag fixtures available");
      }

      const response = await app.handle(
        new Request(`http://localhost/api/hashtags/${fixtureHashtag.id}/stats`)
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe("POST /api/hashtags/:id/stats", () => {
    test("updates hashtag stats", async () => {
      const fixtureHashtag = fixtures.hashtags.hashtags[0];
      const channel = fixtures.channels.channels[0];
      if (!fixtureHashtag || !channel) {
        throw new Error("No hashtag or channel fixtures available");
      }

      const statsData = {
        channelId: channel.id,
        views: 1000,
      };

      const response = await app.handle(
        new Request(`http://localhost/api/hashtags/${fixtureHashtag.id}/stats`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(statsData),
        })
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty("hashtagId");
      expect(data).toHaveProperty("channelId");
    });
  });

  describe("GET /api/hashtags/by-ids", () => {
    test("returns hashtags by ids", async () => {
      const hash1 = fixtures.hashtags.hashtags[0];
      const hash2 = fixtures.hashtags.hashtags[1];
      if (!hash1 || !hash2) {
        throw new Error("No hashtag fixtures available");
      }

      const ids = JSON.stringify([hash1.id, hash2.id]);
      const response = await app.handle(
        new Request(`http://localhost/api/hashtags/by-ids?ids=${encodeURIComponent(ids)}`)
      );
      const data = await response.json();

      expect(data).toHaveLength(2);
    });

    test("handles empty ids array", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/hashtags/by-ids?ids=[]")
      );
      const data = await response.json();

      expect(data).toEqual([]);
    });
  });
});

