import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { Elysia } from "elysia";
import "reflect-metadata";
import { getTestDataSource, resetAllFixtures, setupTestDatabase, teardownTestDatabase } from "../../lib/db.test";
import { serializeJson } from "../../lib/serialize-json";
import { FilterPreset } from "./entity";
import { FILTER_PRESET_FIXTURES } from "./fixtures";
import { filterPresetsRoutes } from "./routes";

describe("Filter Presets Routes", () => {
  // eslint-disable-next-line functional/no-let
  let app: Elysia;
  // eslint-disable-next-line functional/no-let
  let fixtures: Awaited<ReturnType<typeof resetAllFixtures>>;

  beforeAll(async () => {
    await setupTestDatabase();
    fixtures = await resetAllFixtures();
    void fixtures;
    app = new Elysia().mapResponse(serializeJson).use(filterPresetsRoutes);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    fixtures = await resetAllFixtures();
  });

  describe("GET /api/filter-presets", () => {
    test("returns all filter presets", async () => {
      const response = await app.handle(new Request("http://localhost/api/filter-presets"));
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(FILTER_PRESET_FIXTURES.length);
      
      FILTER_PRESET_FIXTURES.forEach((fixture) => {
        const preset = data.find((p: FilterPreset) => p.id === fixture.id);
        expect(preset).toBeDefined();
        expect(preset?.name).toBe(fixture.name);
      });
    });
  });

  describe("GET /api/filter-presets/:id", () => {
    test("returns filter preset by id", async () => {
      const fixturePreset = FILTER_PRESET_FIXTURES[0];
      if (!fixturePreset) {
        throw new Error("No filter preset fixtures available");
      }

      const response = await app.handle(
        new Request(`http://localhost/api/filter-presets/${fixturePreset.id}`)
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.id).toBe(fixturePreset.id);
      expect(data.name).toBe(fixturePreset.name);
    });

    test("returns error for non-existent preset", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/filter-presets/non-existent-id")
      );

      const data = await response.json();
      expect(data).toHaveProperty("error");
      expect(data.error).toBe("Filter preset not found");
    });
  });

  describe("POST /api/filter-presets", () => {
    test("creates a new filter preset", async () => {
      const presetData = {
        name: "New Preset",
        filters: {
          rating: [4, 5],
          isFavorite: true,
        },
      };

      const response = await app.handle(
        new Request("http://localhost/api/filter-presets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(presetData),
        })
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.name).toBe("New Preset");
      expect(data.filtersJson).toBeDefined();
    });
  });

  describe("PATCH /api/filter-presets/:id", () => {
    test("updates filter preset", async () => {
      const fixturePreset = FILTER_PRESET_FIXTURES[0];
      if (!fixturePreset) {
        throw new Error("No filter preset fixtures available");
      }

      const updateData = {
        name: "Updated Preset",
        filters: {
          rating: [5],
        },
      };

      const response = await app.handle(
        new Request(`http://localhost/api/filter-presets/${fixturePreset.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        })
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.name).toBe("Updated Preset");
      expect(data.id).toBe(fixturePreset.id);
    });

    test("returns error for non-existent preset", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/filter-presets/non-existent-id", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Updated" }),
        })
      );

      const data = await response.json();
      expect(data).toHaveProperty("error");
    });
  });

  describe("DELETE /api/filter-presets/:id", () => {
    test("deletes filter preset", async () => {
      const fixturePreset = FILTER_PRESET_FIXTURES[FILTER_PRESET_FIXTURES.length - 1];
      if (!fixturePreset) {
        throw new Error("No filter preset fixtures available");
      }

      const response = await app.handle(
        new Request(`http://localhost/api/filter-presets/${fixturePreset.id}`, {
          method: "DELETE",
        })
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);

      const dataSource = getTestDataSource();
      const repository = dataSource.getRepository(FilterPreset);
      const deletedPreset = await repository.findOne({ where: { id: fixturePreset.id } });
      expect(deletedPreset).toBeNull();
    });
  });
});

