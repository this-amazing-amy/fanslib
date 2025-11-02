import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { Elysia } from "elysia";
import "reflect-metadata";
import { resetAllFixtures, setupTestDatabase, teardownTestDatabase } from "../../lib/db.test";
import { settingsRoutes } from "./routes";

describe("Settings Routes", () => {
  // eslint-disable-next-line functional/no-let
  let app: Elysia;
  // eslint-disable-next-line functional/no-let
  let fixtures: Awaited<ReturnType<typeof resetAllFixtures>>;

  beforeAll(async () => {
    await setupTestDatabase();
    fixtures = await resetAllFixtures();
    void fixtures;
    app = new Elysia().use(settingsRoutes);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    fixtures = await resetAllFixtures();
  });

  describe("GET /api/settings", () => {
    test("returns settings object", async () => {
      const response = await app.handle(new Request("http://localhost/api/settings"));
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(typeof data).toBe("object");
    });
  });

  describe("PATCH /api/settings", () => {
    test("updates settings", async () => {
      const settingsData = {
        libraryPath: "/test/library/path",
        sfwMode: false,
      };

      const response = await app.handle(
        new Request("http://localhost/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settingsData),
        })
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(typeof data).toBe("object");
    });
  });

  describe("POST /api/settings/toggle-sfw", () => {
    test("toggles SFW mode", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/settings/toggle-sfw", {
          method: "POST",
        })
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty("sfwMode");
      expect(typeof data.sfwMode).toBe("boolean");
    });
  });

  describe("Fansly Credentials", () => {
    describe("GET /api/settings/fansly-credentials", () => {
      test("returns fansly credentials", async () => {
        const response = await app.handle(
          new Request("http://localhost/api/settings/fansly-credentials")
        );
        expect(response.status).toBe(200);
        
        const data = await response.json();
        expect(typeof data).toBe("object");
      });
    });

    describe("POST /api/settings/fansly-credentials", () => {
      test("saves fansly credentials", async () => {
        const credentials = {
          authToken: "test-token",
          userId: "test-user-id",
        };

        const response = await app.handle(
          new Request("http://localhost/api/settings/fansly-credentials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials),
          })
        );
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.success).toBe(true);
      });
    });

    describe("DELETE /api/settings/fansly-credentials", () => {
      test("clears fansly credentials", async () => {
        const response = await app.handle(
          new Request("http://localhost/api/settings/fansly-credentials", {
            method: "DELETE",
          })
        );
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.success).toBe(true);
      });
    });
  });
});

