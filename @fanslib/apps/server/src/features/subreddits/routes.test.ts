import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "bun:test";
import { Elysia } from "elysia";
import "reflect-metadata";
import {
  getTestDataSource,
  resetAllFixtures,
  setupTestDatabase,
  teardownTestDatabase,
} from "../../lib/db.test";
import { serializeJson } from "../../lib/serialize-json";
import { Subreddit } from "./entity";
import { SUBREDDIT_FIXTURES } from "./fixtures";
import { subredditsRoutes } from "./routes";

describe("Subreddits Routes", () => {
  // eslint-disable-next-line functional/no-let
  let app: Elysia;
  // eslint-disable-next-line functional/no-let
  let fixtures: Awaited<ReturnType<typeof resetAllFixtures>>;

  beforeAll(async () => {
    await setupTestDatabase();
    fixtures = await resetAllFixtures();
    app = new Elysia().mapResponse(serializeJson).use(subredditsRoutes);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    fixtures = await resetAllFixtures();
  });

  describe("GET /api/subreddits", () => {
    test("returns all subreddits", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/subreddits")
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(SUBREDDIT_FIXTURES.length);
      
      SUBREDDIT_FIXTURES.forEach((fixture) => {
        const subreddit = data.find((s: Subreddit) => s.id === fixture.id);
        expect(subreddit).toBeDefined();
        expect(subreddit?.name).toBe(fixture.name);
      });
    });
  });

  describe("GET /api/subreddits/:id", () => {
    test("returns subreddit by id", async () => {
      const fixtureSubreddit = SUBREDDIT_FIXTURES[0];
      if (!fixtureSubreddit) {
        throw new Error("No subreddit fixtures available");
      }

      const response = await app.handle(
        new Request(`http://localhost/api/subreddits/${fixtureSubreddit.id}`)
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.id).toBe(fixtureSubreddit.id);
      expect(data.name).toBe(fixtureSubreddit.name);
    });

    test("returns error for non-existent subreddit", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/subreddits/non-existent-id")
      );

      const data = await response.json();
      expect(data).toHaveProperty("error");
      expect(data.error).toBe("Subreddit not found");
    });
  });

  describe("POST /api/subreddits", () => {
    test("creates a new subreddit", async () => {
      const subredditData = {
        name: "newsubreddit",
      };

      const response = await app.handle(
        new Request("http://localhost/api/subreddits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subredditData),
        })
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.name).toBe("newsubreddit");
    });
  });

  describe("PATCH /api/subreddits/:id", () => {
    test("updates subreddit", async () => {
      const fixtureSubreddit = SUBREDDIT_FIXTURES[0];
      if (!fixtureSubreddit) {
        throw new Error("No subreddit fixtures available");
      }

      const updateData = {
        name: "updated",
        enabled: false,
      };

      const response = await app.handle(
        new Request(`http://localhost/api/subreddits/${fixtureSubreddit.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        })
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.name).toBe("updated");
      expect(data.enabled).toBe(false);
      expect(data.id).toBe(fixtureSubreddit.id);
    });
  });

  describe("DELETE /api/subreddits/:id", () => {
    test("deletes subreddit", async () => {
      const fixtureSubreddit = SUBREDDIT_FIXTURES[SUBREDDIT_FIXTURES.length - 1];
      if (!fixtureSubreddit) {
        throw new Error("No subreddit fixtures available");
      }

      const response = await app.handle(
        new Request(`http://localhost/api/subreddits/${fixtureSubreddit.id}`, {
          method: "DELETE",
        })
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);

      const dataSource = getTestDataSource();
      const repository = dataSource.getRepository(Subreddit);
      const deletedSubreddit = await repository.findOne({
        where: { id: fixtureSubreddit.id },
      });
      expect(deletedSubreddit).toBeNull();
    });
  });

  describe("POST /api/subreddits/last-post-dates", () => {
    test("returns last post dates for subreddits", async () => {
      const subreddit1 = fixtures.subreddits[0];
      const subreddit2 = fixtures.subreddits[1];
      if (!subreddit1 || !subreddit2) {
        throw new Error("No subreddit fixtures available");
      }

      const response = await app.handle(
        new Request("http://localhost/api/subreddits/last-post-dates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subredditIds: [subreddit1.id, subreddit2.id],
          }),
        })
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(typeof data).toBe("object");
      expect(data).not.toBeNull();
    });

    test("handles empty subreddit list", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/subreddits/last-post-dates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subredditIds: [] }),
        })
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(typeof data).toBe("object");
      expect(Object.keys(data)).toHaveLength(0);
    });
  });
});

