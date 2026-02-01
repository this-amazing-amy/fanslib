import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "bun:test";
import { Hono } from "hono";
import "reflect-metadata";
import {
  getTestDataSource,
  resetAllFixtures,
  setupTestDatabase,
  teardownTestDatabase,
} from "../../lib/db.test";
import { devalueMiddleware } from "../../lib/devalue-middleware";
import { parseResponse } from "../../test-utils/setup";
import { Subreddit } from "./entity";
import { SUBREDDIT_FIXTURES } from "./fixtures";
import { subredditsRoutes } from "./routes";

describe("Subreddits Routes", () => {
  // eslint-disable-next-line functional/no-let
  let app: Hono;
  // eslint-disable-next-line functional/no-let
  let fixtures: Awaited<ReturnType<typeof resetAllFixtures>>;

  beforeAll(async () => {
    await setupTestDatabase();
    fixtures = await resetAllFixtures();
    app = new Hono()
      .use("*", devalueMiddleware())
      .route("/", subredditsRoutes);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    fixtures = await resetAllFixtures();
  });

  describe("GET /api/subreddits/all", () => {
    test("returns all subreddits", async () => {
      const response = await app.request(
        "/api/subreddits/all"
      );
      expect(response.status).toBe(200);

      const data = await parseResponse<Subreddit[]>(response);
      expect(Array.isArray(data)).toBe(true);
      expect(data?.length).toBeGreaterThanOrEqual(SUBREDDIT_FIXTURES.length);

      SUBREDDIT_FIXTURES.forEach((fixture) => {
        const subreddit = data?.find((s: Subreddit) => s.id === fixture.id);
        expect(subreddit).toBeDefined();
        expect(subreddit?.name).toBe(fixture.name);
      });
    });
  });

  describe("GET /api/subreddits/by-id/:id", () => {
    test("returns subreddit by id", async () => {
      const fixtureSubreddit = SUBREDDIT_FIXTURES[0];
      if (!fixtureSubreddit) {
        throw new Error("No subreddit fixtures available");
      }

      const response = await app.request(
        `/api/subreddits/by-id/${fixtureSubreddit.id}`
      );
      expect(response.status).toBe(200);

      const data = await parseResponse<Subreddit>(response);
      expect(data?.id).toBe(fixtureSubreddit.id);
      expect(data?.name).toBe(fixtureSubreddit.name);
    });

    test("returns error for non-existent subreddit", async () => {
      const response = await app.request(
        "/api/subreddits/by-id/non-existent-id"
      );

      const data = await parseResponse<{ error: string }>(response);
      expect(data).toHaveProperty("error");
      expect(data?.error).toBe("Subreddit not found");
    });
  });

  describe("POST /api/subreddits", () => {
    test("creates a new subreddit", async () => {
      const subredditData = {
        name: "newsubreddit",
      };

      const response = await app.request(
        "/api/subreddits",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subredditData),
        }
      );
      expect(response.status).toBe(200);

      const data = await parseResponse<Subreddit>(response);
      expect(data?.name).toBe("newsubreddit");
    });
  });

  describe("PATCH /api/subreddits/by-id/:id", () => {
    test("updates subreddit", async () => {
      const fixtureSubreddit = SUBREDDIT_FIXTURES[0];
      if (!fixtureSubreddit) {
        throw new Error("No subreddit fixtures available");
      }

      const updateData = {
        name: "updated",
        notes: "Updated notes",
      };

      const response = await app.request(
        `/api/subreddits/by-id/${fixtureSubreddit.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );
      expect(response.status).toBe(200);

      const data = await parseResponse<Subreddit>(response);
      expect(data?.name).toBe("updated");
      expect(data?.notes).toBe("Updated notes");
      expect(data?.id).toBe(fixtureSubreddit.id);
    });
  });

  describe("DELETE /api/subreddits/by-id/:id", () => {
    test("deletes subreddit", async () => {
      const fixtureSubreddit = SUBREDDIT_FIXTURES[SUBREDDIT_FIXTURES.length - 1];
      if (!fixtureSubreddit) {
        throw new Error("No subreddit fixtures available");
      }

      const response = await app.request(
        `/api/subreddits/by-id/${fixtureSubreddit.id}`,
        {
          method: "DELETE",
        }
      );
      expect(response.status).toBe(200);

      const data = await parseResponse<{ success: boolean }>(response);
      expect(data?.success).toBe(true);

      const dataSource = getTestDataSource();
      const repository = dataSource.getRepository(Subreddit);
      const deletedSubreddit = await repository.findOne({
        where: { id: fixtureSubreddit.id },
      });
      expect(deletedSubreddit).toBeNull();
    });

    test("returns 404 when subreddit not found", async () => {
      const response = await app.request(
        "/api/subreddits/by-id/non-existent-id",
        {
          method: "DELETE",
        }
      );
      expect(response.status).toBe(404);

      const data = await parseResponse<{ error: string }>(response);
      expect(data?.error).toBe("Subreddit not found");
    });
  });

  describe("POST /api/subreddits/last-post-dates", () => {
    test("returns last post dates for subreddits", async () => {
      const subreddit1 = fixtures.subreddits[0];
      const subreddit2 = fixtures.subreddits[1];
      if (!subreddit1 || !subreddit2) {
        throw new Error("No subreddit fixtures available");
      }

      const response = await app.request(
        "/api/subreddits/last-post-dates",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subredditIds: [subreddit1.id, subreddit2.id],
          }),
        }
      );
      expect(response.status).toBe(200);

      const data = await parseResponse<Record<string, Date | null>>(response);
      expect(typeof data).toBe("object");
      expect(data).not.toBeNull();
    });

    test("handles empty subreddit list", async () => {
      const response = await app.request(
        "/api/subreddits/last-post-dates",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subredditIds: [] }),
        }
      );
      expect(response.status).toBe(200);

      const data = await parseResponse<Record<string, Date | null>>(response);
      expect(typeof data).toBe("object");
      expect(data && Object.keys(data)).toHaveLength(0);
    });
  });
});

