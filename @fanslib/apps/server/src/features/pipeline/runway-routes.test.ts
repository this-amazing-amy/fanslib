import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { Hono } from "hono";
import "reflect-metadata";
import { setupTestDatabase, teardownTestDatabase } from "../../lib/test-db";
import { resetAllFixtures } from "../../lib/test-fixtures";
import { devalueMiddleware } from "../../lib/devalue-middleware";
import { parseResponse } from "../../test-utils/setup";
import { runwayRoutes } from "./runway-routes";
import type { RunwayResponse } from "./operations/get-runway";

describe("Runway Routes", () => {
  // eslint-disable-next-line functional/no-let
  let app: Hono;

  beforeAll(async () => {
    await setupTestDatabase();
    await resetAllFixtures();
    app = new Hono().use("*", devalueMiddleware()).route("/", runwayRoutes);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await resetAllFixtures();
  });

  describe("GET /api/runway", () => {
    test("returns 200 with runway shape", async () => {
      const response = await app.request("/api/runway");
      expect(response.status).toBe(200);

      const data = await parseResponse<RunwayResponse>(response);
      expect(data).toBeDefined();
      expect(data?.runway).toBeDefined();
      expect(typeof data?.runway.totalDays).toBe("number");
      expect(Array.isArray(data?.runway.details)).toBe(true);
    });

    test("each detail has required fields", async () => {
      const response = await app.request("/api/runway");
      expect(response.status).toBe(200);

      const data = await parseResponse<RunwayResponse>(response);
      data?.runway.details.forEach((detail) => {
        expect(detail.schedule).toBeDefined();
        expect(typeof detail.schedule.id).toBe("string");
        expect(typeof detail.schedule.name).toBe("string");
        expect(Array.isArray(detail.channels)).toBe(true);
        expect(typeof detail.frequency).toBe("string");
        expect(typeof detail.availableMedia).toBe("number");
        expect(typeof detail.daysLeft).toBe("number");
        // runsOutAt is a date string or null
        if (detail.runsOutAt !== null) {
          expect(typeof detail.runsOutAt).toBe("string");
          expect(detail.runsOutAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        }
      });
    });

    test("totalDays is the minimum daysLeft across all schedules", async () => {
      const response = await app.request("/api/runway");
      expect(response.status).toBe(200);

      const data = await parseResponse<RunwayResponse>(response);
      if (!data || data.runway.details.length === 0) return;

      const minDays = Math.min(...data.runway.details.map((d) => d.daysLeft));
      expect(data.runway.totalDays).toBe(minDays);
    });

    test("frequency field matches expected format", async () => {
      const response = await app.request("/api/runway");
      expect(response.status).toBe(200);

      const data = await parseResponse<RunwayResponse>(response);
      const validFrequencyPattern = /^(daily|weekly|monthly|\d+x\/(day|week|month))$/;
      data?.runway.details.forEach((detail) => {
        expect(detail.frequency).toMatch(validFrequencyPattern);
      });
    });
  });
});
