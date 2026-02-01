import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { Hono } from "hono";
import "reflect-metadata";
import { getTestDataSource, setupTestDatabase, teardownTestDatabase } from "../../lib/test-db";
import { resetAllFixtures } from "../../lib/test-fixtures";
import { devalueMiddleware } from "../../lib/devalue-middleware";
import { parseResponse } from "../../test-utils/setup";
import { Hashtag as HashtagEntity } from "./entity";
import { HASHTAG_FIXTURES } from "./fixtures-data";
import { normalizeHashtagName } from "./operations/hashtag/helpers";
import { hashtagsRoutes } from "./routes";

type Hashtag = HashtagEntity;

describe("Hashtags Routes", () => {
  // eslint-disable-next-line functional/no-let
  let app: Hono;
  // eslint-disable-next-line functional/no-let
  let fixtures: Awaited<ReturnType<typeof resetAllFixtures>>;

  beforeAll(async () => {
    await setupTestDatabase();
    fixtures = await resetAllFixtures();
    app = new Hono()
      .use("*", devalueMiddleware())
      .route("/", hashtagsRoutes);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    fixtures = await resetAllFixtures();
  });

  describe("GET /api/hashtags/all", () => {
    test("returns all hashtags", async () => {
      const response = await app.request("/api/hashtags/all");
      expect(response.status).toBe(200);

      const data = await parseResponse<Hashtag[]>(response);
      expect(Array.isArray(data)).toBe(true);
      expect(data?.length).toBeGreaterThanOrEqual(HASHTAG_FIXTURES.length);

      HASHTAG_FIXTURES.forEach((fixture) => {
        const normalizedName = normalizeHashtagName(fixture.name);
        const hashtag = data?.find((h: Hashtag) => h.name === normalizedName);
        expect(hashtag).toBeDefined();
        expect(hashtag?.name).toBe(normalizedName);
      });
    });
  });

  describe("GET /api/hashtags/by-id/:id", () => {
    test("returns hashtag by id", async () => {
      const fixtureHashtag = fixtures.hashtags.hashtags[0];
      if (!fixtureHashtag) {
        throw new Error("No hashtag fixtures available");
      }

      const response = await app.request(`/api/hashtags/by-id/${fixtureHashtag.id}`);
      expect(response.status).toBe(200);

      const data = await parseResponse<Hashtag>(response);
      expect(data?.id).toBe(fixtureHashtag.id);
      expect(data?.name).toBe(fixtureHashtag.name);
    });

    test("returns error for non-existent hashtag", async () => {
      const response = await app.request("/api/hashtags/by-id/999999");

      const data = await parseResponse<{ error: string }>(response);
      expect(data).toHaveProperty("error");
      expect(data?.error).toBe("Hashtag not found");
    });
  });

  describe("POST /api/hashtags", () => {
    test("creates a new hashtag", async () => {
      const hashtagData = {
        name: "newhash",
      };

      const response = await app.request("/api/hashtags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hashtagData),
      });
      expect(response.status).toBe(200);

      const data = await parseResponse<Hashtag>(response);
      expect(data?.name).toBe("#newhash");
    });

    test("returns existing hashtag if name already exists", async () => {
      const existing = fixtures.hashtags.hashtags[0];
      if (!existing) {
        throw new Error("No hashtag fixtures available");
      }

      const response = await app.request("/api/hashtags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: existing.name }),
      });

      const data = await parseResponse<Hashtag>(response);
      expect(data?.id).toBe(existing.id);
      expect(data?.name).toBe(existing.name);
    });
  });

  describe("POST /api/hashtags/by-ids", () => {
    test("creates multiple hashtags", async () => {
      const response = await app.request("/api/hashtags/by-ids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names: ["hash1", "hash2", "hash3"] }),
      });
      expect(response.status).toBe(200);

      const data = await parseResponse<Hashtag[]>(response);
      expect(data).toHaveLength(3);
      expect(data?.[0]?.name).toBe("#hash1");
      expect(data?.[1]?.name).toBe("#hash2");
      expect(data?.[2]?.name).toBe("#hash3");
    });

    test("handles mix of new and existing hashtags", async () => {
      const existing = fixtures.hashtags.hashtags[0];
      if (!existing) {
        throw new Error("No hashtag fixtures available");
      }

      const response = await app.request("/api/hashtags/by-ids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names: [existing.name, "#newhash"] }),
      });

      const data = await parseResponse<Hashtag[]>(response);
      expect(data).toHaveLength(2);
    });
  });

  describe("DELETE /api/hashtags/by-id/:id", () => {
    test("deletes hashtag", async () => {
      const fixtureHashtag = fixtures.hashtags.hashtags[fixtures.hashtags.hashtags.length - 1];
      if (!fixtureHashtag) {
        throw new Error("No hashtag fixtures available");
      }

      const response = await app.request(`/api/hashtags/by-id/${fixtureHashtag.id}`, {
        method: "DELETE",
      });
      expect(response.status).toBe(200);

      const data = await parseResponse<{ success: boolean }>(response);
      expect(data?.success).toBe(true);

      const dataSource = getTestDataSource();
      const repository = dataSource.getRepository(HashtagEntity);
      const deletedHashtag = await repository.findOne({ where: { id: fixtureHashtag.id } });
      expect(deletedHashtag).toBeNull();
    });
  });

  describe("GET /api/hashtags/by-id/:id/stats", () => {
    test("returns hashtag stats", async () => {
      const fixtureHashtag = fixtures.hashtags.hashtags[0];
      if (!fixtureHashtag) {
        throw new Error("No hashtag fixtures available");
      }

      const response = await app.request(`/api/hashtags/by-id/${fixtureHashtag.id}/stats`);
      expect(response.status).toBe(200);

      const data = await parseResponse<unknown[]>(response);
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe("POST /api/hashtags/by-id/:id/stats", () => {
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

      const response = await app.request(`/api/hashtags/by-id/${fixtureHashtag.id}/stats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(statsData),
      });
      expect(response.status).toBe(200);

      const data = await parseResponse<{ hashtagId: number; channelId: string }>(response);
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
      const response = await app.request(`/api/hashtags/by-ids?ids=${encodeURIComponent(ids)}`);
      const data = await parseResponse<Hashtag[]>(response);

      expect(data).toHaveLength(2);
    });

    test("handles empty ids array", async () => {
      const response = await app.request("/api/hashtags/by-ids?ids=[]");
      const data = await parseResponse<Hashtag[]>(response);

      expect(data).toEqual([]);
    });
  });
});

