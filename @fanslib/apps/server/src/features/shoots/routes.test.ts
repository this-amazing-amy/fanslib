import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { Elysia } from "elysia";
import "reflect-metadata";
import { getTestDataSource, resetAllFixtures, setupTestDatabase, teardownTestDatabase } from "../../lib/db.test";
import { serializeJson } from "../../lib/serialize-json";
import { Shoot } from "./entity";
import { SHOOT_FIXTURES } from "./fixtures";
import { shootsRoutes } from "./routes";

describe("Shoots Routes", () => {
  // eslint-disable-next-line functional/no-let
  let app: Elysia;
  // eslint-disable-next-line functional/no-let
  let fixtures: Awaited<ReturnType<typeof resetAllFixtures>>;

  beforeAll(async () => {
    await setupTestDatabase();
    fixtures = await resetAllFixtures();
    void fixtures;
    app = new Elysia().mapResponse(serializeJson).use(shootsRoutes);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    fixtures = await resetAllFixtures();
  });

  describe("GET /api/shoots", () => {
    test("returns all shoots", async () => {
      const response = await app.handle(new Request("http://localhost/api/shoots"));
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data.items)).toBe(true);
      expect(data.items.length).toBeGreaterThanOrEqual(SHOOT_FIXTURES.length);
      
      SHOOT_FIXTURES.forEach((fixture) => {
        const shoot = data.items.find((s: Shoot) => s.id === fixture.id);
        expect(shoot).toBeDefined();
        expect(shoot?.name).toBe(fixture.name);
      });
    });

    test("supports pagination", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/shoots?page=1&limit=2")
      );
      const data = await response.json();

      expect(data.items).toHaveLength(2);
      expect(data.total).toBeGreaterThanOrEqual(SHOOT_FIXTURES.length);
      expect(data.page).toBe(1);
      expect(data.limit).toBe(2);
    });
  });

  describe("GET /api/shoots/:id", () => {
    test("returns shoot by id", async () => {
      const fixtureShoot = SHOOT_FIXTURES[0];
      if (!fixtureShoot) {
        throw new Error("No shoot fixtures available");
      }

      const response = await app.handle(
        new Request(`http://localhost/api/shoots/${fixtureShoot.id}`)
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.id).toBe(fixtureShoot.id);
      expect(data.name).toBe(fixtureShoot.name);
    });

    test("returns error for non-existent shoot", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/shoots/non-existent-id")
      );

      const data = await response.json();
      expect(data).toHaveProperty("error");
      expect(data.error).toBe("Shoot not found");
    });
  });

  describe("POST /api/shoots", () => {
    test("creates a new shoot", async () => {
      const shootData = {
        name: "New Shoot",
        shootDate: new Date().toISOString(),
      };

      const response = await app.handle(
        new Request("http://localhost/api/shoots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(shootData),
        })
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.name).toBe("New Shoot");
    });
  });

  describe("PATCH /api/shoots/:id", () => {
    test("updates shoot", async () => {
      const fixtureShoot = SHOOT_FIXTURES[0];
      if (!fixtureShoot) {
        throw new Error("No shoot fixtures available");
      }

      const updateData = {
        name: "Updated Name",
      };

      const response = await app.handle(
        new Request(`http://localhost/api/shoots/${fixtureShoot.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        })
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.name).toBe("Updated Name");
      expect(data.id).toBe(fixtureShoot.id);
    });
  });

  describe("DELETE /api/shoots/:id", () => {
    test("deletes shoot", async () => {
      const fixtureShoot = SHOOT_FIXTURES[SHOOT_FIXTURES.length - 1];
      if (!fixtureShoot) {
        throw new Error("No shoot fixtures available");
      }

      const response = await app.handle(
        new Request(`http://localhost/api/shoots/${fixtureShoot.id}`, {
          method: "DELETE",
        })
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);

      const dataSource = getTestDataSource();
      const repository = dataSource.getRepository(Shoot);
      const deletedShoot = await repository.findOne({ where: { id: fixtureShoot.id } });
      expect(deletedShoot).toBeNull();
    });
  });
});

