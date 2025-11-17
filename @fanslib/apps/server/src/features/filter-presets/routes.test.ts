import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { Elysia } from "elysia";
import "reflect-metadata";
import { getTestDataSource, resetAllFixtures, setupTestDatabase, teardownTestDatabase } from "../../lib/db.test";
import { mapResponse } from "../../lib/serialization";
import { logError, parseResponse } from "../../test-utils/setup";
import { FilterPreset } from "./entity";
import { FILTER_PRESET_FIXTURES } from "./fixtures";
import type { CreateFilterPresetRequestBodySchema } from "./operations/filter-preset/create";
import type { UpdateFilterPresetRequestBodySchema } from "./operations/filter-preset/update";
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
    app = new Elysia().onError(logError()).mapResponse(mapResponse).use(filterPresetsRoutes);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    fixtures = await resetAllFixtures();
  });

  describe("GET /api/filter-presets/all", () => {
    test("returns all filter presets", async () => {
      const response = await app.handle(new Request("http://localhost/api/filter-presets/all"));
      expect(response.status).toBe(200);

      const data = await parseResponse<FilterPreset[]>(response);
      expect(Array.isArray(data)).toBe(true);
      expect(data?.length).toBeGreaterThanOrEqual(FILTER_PRESET_FIXTURES.length);

      FILTER_PRESET_FIXTURES.forEach((fixture) => {
        const preset = data?.find((p: FilterPreset) => p.id === fixture.id);
        expect(preset).toBeDefined();
        expect(preset?.name).toBe(fixture.name);
      });
    });
  });

  describe("GET /api/filter-presets/by-id/:id", () => {
    test("returns filter preset by id", async () => {
      const fixturePreset = FILTER_PRESET_FIXTURES[0];
      if (!fixturePreset) {
        throw new Error("No filter preset fixtures available");
      }

      const response = await app.handle(
        new Request(`http://localhost/api/filter-presets/by-id/${fixturePreset.id}`)
      );

      expect(response.status).toBe(200);

      const data = await parseResponse<FilterPreset>(response);
      expect(data?.id).toBe(fixturePreset.id);
      expect(data?.name).toBe(fixturePreset.name);
    });

    test("returns error for non-existent preset", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/filter-presets/by-id/non-existent-id")
      );

      const data = await parseResponse<{ error: string }>(response);
      expect(data).toHaveProperty("error");
      expect(data?.error).toBe("Filter preset not found");
    });
  });

  describe("POST /api/filter-presets", () => {
    test("creates a new filter preset", async () => {
      const fixtureChannel = fixtures.channels.channels[0];
      if (!fixtureChannel) {
        throw new Error("No channel fixtures available");
      }
      const presetData: typeof CreateFilterPresetRequestBodySchema.static = {
        name: "New Preset",
        filters: [    {
          include: true,
          items: [
            { type: "channel", id: fixtureChannel.id },
          ],
        }],
      };

      const response = await app.handle(
        new Request("http://localhost/api/filter-presets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(presetData),
        })
      );
      expect(response.status).toBe(200);

      const data = await parseResponse<Omit<FilterPreset, 'filtersJson'> & { filters: unknown }>(response);

      expect(data?.name).toBe("New Preset");
      expect(data?.filters).toBeDefined();
    });
  });

  describe("PATCH /api/filter-presets/by-id/:id", () => {
    test("updates filter preset", async () => {
      const fixturePreset = FILTER_PRESET_FIXTURES[0];
      const fixtureChannel = fixtures.channels.channels[0];
      if (!fixtureChannel) {
        throw new Error("No channel fixtures available");
      }
      if (!fixturePreset) {
        throw new Error("No filter preset fixtures available");
      }

      const updateData: typeof UpdateFilterPresetRequestBodySchema.static = {
        name: "Updated Preset",
        filters: [{
          include: true,
          items: [
            { type: "channel", id: fixtureChannel.id },
          ],
        }],
      };

      const response = await app.handle(
        new Request(`http://localhost/api/filter-presets/by-id/${fixturePreset.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        })
      );
      expect(response.status).toBe(200);

      const data = await parseResponse<FilterPreset>(response);
      expect(data?.name).toBe("Updated Preset");
      expect(data?.id).toBe(fixturePreset.id);
    });

    test("returns error for non-existent preset", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/filter-presets/by-id/non-existent-id", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Updated" }),
        })
      );

      const data = await parseResponse<{ error: string }>(response);
      expect(data).toHaveProperty("error");
    });
  });

  describe("DELETE /api/filter-presets/by-id/:id", () => {
    test("deletes filter preset", async () => {
      const fixturePreset = FILTER_PRESET_FIXTURES[FILTER_PRESET_FIXTURES.length - 1];
      if (!fixturePreset) {
        throw new Error("No filter preset fixtures available");
      }

      const response = await app.handle(
        new Request(`http://localhost/api/filter-presets/by-id/${fixturePreset.id}`, {
          method: "DELETE",
        })
      );
      expect(response.status).toBe(200);

      const data = await parseResponse<{ success: boolean }>(response);
      expect(data?.success).toBe(true);

      const dataSource = getTestDataSource();
      const repository = dataSource.getRepository(FilterPreset);
      const deletedPreset = await repository.findOne({ where: { id: fixturePreset.id } });
      expect(deletedPreset).toBeNull();
    });

    test("returns 404 when filter preset not found", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/filter-presets/by-id/non-existent-id", {
          method: "DELETE",
        })
      );
      expect(response.status).toBe(404);

      const data = await parseResponse<{ error: string }>(response);
      expect(data?.error).toBe("Filter preset not found");
    });
  });
});

