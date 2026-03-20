import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { Hono } from "hono";
import "reflect-metadata";
import { setupTestDatabase, teardownTestDatabase } from "../../lib/test-db";
import { resetAllFixtures } from "../../lib/test-fixtures";
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

      test("returns stale: false when credentials are not stale", async () => {
        // Save fresh credentials first
        await app.request("/api/settings/fansly-credentials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fanslyAuth: "test-auth", fanslySessionId: "test-session" }),
        });

        const response = await app.request("/api/settings/fansly-credentials");
        const data = await parseResponse<{ stale: boolean }>(response);
        expect(data?.stale).toBe(false);
      });

      test("returns stale: true after credentials are marked stale", async () => {
        // Save credentials first
        await app.request("/api/settings/fansly-credentials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fanslyAuth: "test-auth", fanslySessionId: "test-session" }),
        });

        // Mark as stale
        await app.request("/api/settings/fansly-credential-stale", { method: "POST" });

        const response = await app.request("/api/settings/fansly-credentials");
        const data = await parseResponse<{ stale: boolean }>(response);
        expect(data?.stale).toBe(true);
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

      test("saving credentials clears the stale flag", async () => {
        // Save initial credentials
        await app.request("/api/settings/fansly-credentials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fanslyAuth: "old-auth" }),
        });

        // Mark as stale
        await app.request("/api/settings/fansly-credential-stale", { method: "POST" });

        // Verify stale
        const staleRes = await app.request("/api/settings/fansly-credentials");
        const staleData = await parseResponse<{ stale: boolean }>(staleRes);
        expect(staleData?.stale).toBe(true);

        // Save fresh credentials
        await app.request("/api/settings/fansly-credentials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fanslyAuth: "new-auth", fanslySessionId: "new-session" }),
        });

        // Verify stale is cleared
        const freshRes = await app.request("/api/settings/fansly-credentials");
        const freshData = await parseResponse<{ stale: boolean; credentials: Record<string, unknown> }>(freshRes);
        expect(freshData?.stale).toBe(false);
        expect(freshData?.credentials?.fanslyAuth).toBe("new-auth");
      });
    });

    describe("POST /api/settings/fansly-credential-stale", () => {
      test("marks credentials as stale", async () => {
        // Save credentials first
        await app.request("/api/settings/fansly-credentials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fanslyAuth: "test-auth", fanslySessionId: "test-session" }),
        });

        const response = await app.request("/api/settings/fansly-credential-stale", {
          method: "POST",
        });
        expect(response.status).toBe(200);

        const data = await parseResponse<{ success: boolean }>(response);
        expect(data?.success).toBe(true);
      });
    });

    describe("GET /api/settings/fansly-credential-status", () => {
      test("returns green when credentials refreshed recently (< 24h)", async () => {
        await app.request("/api/settings/fansly-credentials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fanslyAuth: "test-auth", fanslySessionId: "test-session" }),
        });

        const response = await app.request("/api/settings/fansly-credential-status");
        expect(response.status).toBe(200);

        const data = await parseResponse<{ status: string; stale: boolean; lastUpdated: number | null }>(response);
        expect(data?.status).toBe("green");
        expect(data?.stale).toBe(false);
        expect(data?.lastUpdated).toBeNumber();
      });

      test("returns red when credentials are stale", async () => {
        await app.request("/api/settings/fansly-credentials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fanslyAuth: "test-auth", fanslySessionId: "test-session" }),
        });

        // Mark stale
        await app.request("/api/settings/fansly-credential-stale", { method: "POST" });

        const response = await app.request("/api/settings/fansly-credential-status");
        const data = await parseResponse<{ status: string; stale: boolean }>(response);
        expect(data?.status).toBe("red");
        expect(data?.stale).toBe(true);
      });

      test("returns red when no credentials exist", async () => {
        // Clear any leftover credentials from previous tests
        await app.request("/api/settings/fansly-credentials", { method: "DELETE" });

        const response = await app.request("/api/settings/fansly-credential-status");
        const data = await parseResponse<{ status: string; lastUpdated: number | null }>(response);
        expect(data?.status).toBe("red");
        expect(data?.lastUpdated).toBeNull();
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

