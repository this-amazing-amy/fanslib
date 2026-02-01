import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { Hono } from "hono";
import "reflect-metadata";
import { resetAllFixtures, setupTestDatabase, teardownTestDatabase } from "../../lib/db.test";
import { devalueMiddleware } from "../../lib/devalue-middleware";
import { parseResponse } from "../../test-utils/setup";
import { settingsRoutes } from "./routes";

describe("Settings Routes", () => {
  // eslint-disable-next-line functional/no-let
  let app: Hono;
  // eslint-disable-next-line functional/no-let
  let fixtures: Awaited<ReturnType<typeof resetAllFixtures>>;

  beforeAll(async () => {
    await setupTestDatabase();
    fixtures = await resetAllFixtures();
    void fixtures;
    app = new Hono()
      .use("*", devalueMiddleware())
      .route("/", settingsRoutes);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    fixtures = await resetAllFixtures();
  });

  describe("GET /api/settings", () => {
    test("returns settings object", async () => {
      const response = await app.request("/api/settings");
      expect(response.status).toBe(200);

      const data = await parseResponse<Record<string, unknown>>(response);
      expect(typeof data).toBe("object");
    });
  });

  describe("PATCH /api/settings", () => {
    test("updates settings", async () => {
      const settingsData = {
        libraryPath: "/test/library/path",
        sfwMode: false,
      };

      const response = await app.request("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsData),
      });
      expect(response.status).toBe(200);

      const data = await parseResponse<Record<string, unknown>>(response);
      expect(typeof data).toBe("object");
    });
  });

  describe("POST /api/settings/toggle-sfw", () => {
    test("toggles SFW mode", async () => {
      const response = await app.request("/api/settings/toggle-sfw", {
        method: "POST",
      });
      expect(response.status).toBe(200);

      const data = await parseResponse<{ sfwMode: boolean }>(response);
      expect(data).toHaveProperty("sfwMode");
      expect(typeof data?.sfwMode).toBe("boolean");
    });
  });

  describe("Fansly Credentials", () => {
    describe("GET /api/settings/fansly-credentials", () => {
      test("returns fansly credentials", async () => {
        const response = await app.request("/api/settings/fansly-credentials");
        expect(response.status).toBe(200);

        const data = await parseResponse<{ credentials: Record<string, unknown>; lastUpdated: number | null } | null>(response);
        if (data) {
          expect(typeof data).toBe("object");
          expect(data).toHaveProperty("credentials");
          expect(data).toHaveProperty("lastUpdated");
        }
      });
    });

    describe("POST /api/settings/fansly-credentials", () => {
      test("saves fansly credentials", async () => {
        const credentials = {
          authToken: "test-token",
          userId: "test-user-id",
        };

        const response = await app.request("/api/settings/fansly-credentials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        });
        expect(response.status).toBe(200);

        const data = await parseResponse<{ success: boolean }>(response);
        expect(data?.success).toBe(true);
      });
    });

    describe("DELETE /api/settings/fansly-credentials", () => {
      test("clears fansly credentials", async () => {
        const response = await app.request("/api/settings/fansly-credentials", {
          method: "DELETE",
        });
        expect(response.status).toBe(200);

        const data = await parseResponse<{ success: boolean }>(response);
        expect(data?.success).toBe(true);
      });
    });
  });
});

