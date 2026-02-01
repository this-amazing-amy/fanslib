import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { Hono } from "hono";
import "reflect-metadata";
import { getTestDataSource, setupTestDatabase, teardownTestDatabase } from "../../lib/test-db";
import { resetAllFixtures } from "../../lib/test-fixtures";
import { devalueMiddleware } from "../../lib/devalue-middleware";
import { parseResponse } from "../../test-utils/setup";
import { Shoot } from "./entity";
import { SHOOT_FIXTURES } from "./fixtures-data";
import { shootsRoutes } from "./routes";

describe("Shoots Routes", () => {
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
      .route("/", shootsRoutes);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    fixtures = await resetAllFixtures();
  });

  describe("POST /api/shoots/all", () => {
    test("returns all shoots", async () => {
      const response = await app.request("/api/shoots/all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(response.status).toBe(200);

      const data = await parseResponse<{ items: Shoot[]; total: number; page: number; limit: number }>(response);
      expect(Array.isArray(data?.items)).toBe(true);
      expect(data?.items.length).toBeGreaterThanOrEqual(SHOOT_FIXTURES.length);

      SHOOT_FIXTURES.forEach((fixture) => {
        const shoot = data?.items.find((s: Shoot) => s.id === fixture.id);
        expect(shoot).toBeDefined();
        expect(shoot?.name).toBe(fixture.name);
      });
    });

    test("supports pagination", async () => {
      const response = await app.request("/api/shoots/all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page: 1,
          limit: 2,
        }),
      });
      const data = await parseResponse<{ items: Shoot[]; total: number; page: number; limit: number }>(response);

      expect(data?.items).toHaveLength(2);
      expect(data?.total).toBeGreaterThanOrEqual(SHOOT_FIXTURES.length);
      expect(data?.page).toBe(1);
      expect(data?.limit).toBe(2);
    });
  });

  describe("GET /api/shoots/by-id/:id", () => {
    test("returns shoot by id", async () => {
      const fixtureShoot = SHOOT_FIXTURES[0];
      if (!fixtureShoot) {
        throw new Error("No shoot fixtures available");
      }

      const response = await app.request(`/api/shoots/by-id/${fixtureShoot.id}`);
      expect(response.status).toBe(200);

      const data = await parseResponse<Shoot>(response);
      expect(data?.id).toBe(fixtureShoot.id);
      expect(data?.name).toBe(fixtureShoot.name);
    });

    test("returns error for non-existent shoot", async () => {
      const response = await app.request("/api/shoots/by-id/non-existent-id");

      const data = await parseResponse<{ error: string }>(response);
      expect(data).toHaveProperty("error");
      expect(data?.error).toBe("Shoot not found");
    });
  });

  describe("POST /api/shoots", () => {
    test("creates a new shoot", async () => {
      const shootData = {
        name: "New Shoot",
        shootDate: new Date().toISOString(),
      };

      const response = await app.request("/api/shoots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shootData),
      });
      expect(response.status).toBe(200);

      const data = await parseResponse<Shoot>(response);
      expect(data?.name).toBe("New Shoot");
    });
  });

  describe("PATCH /api/shoots/by-id/:id", () => {
    test("updates shoot", async () => {
      const fixtureShoot = SHOOT_FIXTURES[0];
      if (!fixtureShoot) {
        throw new Error("No shoot fixtures available");
      }

      const updateData = {
        name: "Updated Name",
      };

      const response = await app.request(`/api/shoots/by-id/${fixtureShoot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      expect(response.status).toBe(200);

      const data = await parseResponse<Shoot>(response);
      expect(data?.name).toBe("Updated Name");
      expect(data?.id).toBe(fixtureShoot.id);
    });
  });

  describe("DELETE /api/shoots/by-id/:id", () => {
    test("deletes shoot", async () => {
      const fixtureShoot = SHOOT_FIXTURES[SHOOT_FIXTURES.length - 1];
      if (!fixtureShoot) {
        throw new Error("No shoot fixtures available");
      }

      const response = await app.request(`/api/shoots/by-id/${fixtureShoot.id}`, {
        method: "DELETE",
      });
      expect(response.status).toBe(200);

      const data = await parseResponse<{ success: boolean }>(response);
      expect(data?.success).toBe(true);

      const dataSource = getTestDataSource();
      const repository = dataSource.getRepository(Shoot);
      const deletedShoot = await repository.findOne({ where: { id: fixtureShoot.id } });
      expect(deletedShoot).toBeNull();
    });

    test("returns 404 when shoot not found", async () => {
      const response = await app.request("/api/shoots/by-id/non-existent-id", {
        method: "DELETE",
      });
      expect(response.status).toBe(404);

      const data = await parseResponse<{ error: string }>(response);
      expect(data?.error).toBe("Shoot not found");
    });
  });
});

