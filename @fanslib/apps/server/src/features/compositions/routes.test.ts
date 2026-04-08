import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { Hono } from "hono";
import "reflect-metadata";
import { getTestDataSource, setupTestDatabase, teardownTestDatabase } from "../../lib/test-db";
import { resetAllFixtures } from "../../lib/test-fixtures";
import { devalueMiddleware } from "../../lib/devalue-middleware";
import { parseResponse } from "../../test-utils/setup";
import { Shoot } from "../shoots/entity";
import { compositionsRoutes } from "./routes";

describe("Compositions Routes", () => {
  // eslint-disable-next-line functional/no-let
  let app: Hono;
  // eslint-disable-next-line functional/no-let
  let testShoot: Shoot;

  beforeAll(async () => {
    await setupTestDatabase();
    await resetAllFixtures();
    app = new Hono().use("*", devalueMiddleware()).route("/", compositionsRoutes);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await resetAllFixtures();
    // Create a shoot for compositions to reference
    const dataSource = getTestDataSource();
    const shootRepo = dataSource.getRepository(Shoot);
    testShoot = shootRepo.create({
      name: "Test Shoot",
      shootDate: new Date("2026-04-08"),
    });
    testShoot = await shootRepo.save(testShoot);
  });

  describe("POST /api/compositions", () => {
    test("creates a composition and returns it with all fields", async () => {
      const response = await app.request("/api/compositions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shootId: testShoot.id,
          name: "Trailer v1",
        }),
      });
      expect(response.status).toBe(200);

      const data = await parseResponse<{
        id: string;
        shootId: string;
        name: string;
        segments: unknown[];
        tracks: unknown[];
        exportRegions: unknown[];
        createdAt: string;
        updatedAt: string;
      }>(response);

      expect(data?.id).toBeDefined();
      expect(data?.shootId).toBe(testShoot.id);
      expect(data?.name).toBe("Trailer v1");
      expect(data?.segments).toEqual([]);
      expect(data?.tracks).toEqual([]);
      expect(data?.exportRegions).toEqual([]);
    });
  });

  describe("PATCH /api/compositions/by-id/:id", () => {
    test("updates composition name, segments, tracks, and exportRegions", async () => {
      const createResponse = await app.request("/api/compositions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shootId: testShoot.id, name: "Original" }),
      });
      const created = await parseResponse<{ id: string }>(createResponse);

      const segments = [
        { id: "seg-1", sourceMediaId: "media-1", sourceStartFrame: 0, sourceEndFrame: 900 },
      ];
      const tracks = [
        { id: "track-1", name: "Overlays", operations: [] },
      ];
      const exportRegions = [
        { id: "er-1", startFrame: 0, endFrame: 450 },
      ];

      const response = await app.request(`/api/compositions/by-id/${created?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Updated",
          segments,
          tracks,
          exportRegions,
        }),
      });
      expect(response.status).toBe(200);

      const data = await parseResponse<{
        name: string;
        segments: unknown[];
        tracks: unknown[];
        exportRegions: unknown[];
      }>(response);
      expect(data?.name).toBe("Updated");
      expect(data?.segments).toHaveLength(1);
      expect(data?.tracks).toHaveLength(1);
      expect(data?.exportRegions).toHaveLength(1);
    });

    test("returns 404 for non-existent composition", async () => {
      const response = await app.request("/api/compositions/by-id/nonexistent", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Nope" }),
      });
      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/compositions/by-shoot/:shootId", () => {
    test("lists all compositions for a shoot", async () => {
      await app.request("/api/compositions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shootId: testShoot.id, name: "Comp A" }),
      });
      await app.request("/api/compositions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shootId: testShoot.id, name: "Comp B" }),
      });

      const response = await app.request(`/api/compositions/by-shoot/${testShoot.id}`);
      expect(response.status).toBe(200);

      const data = await parseResponse<{ id: string; name: string }[]>(response);
      expect(data).toHaveLength(2);
      const names = data?.map((c) => c.name).sort();
      expect(names).toEqual(["Comp A", "Comp B"]);
    });

    test("returns empty array for shoot with no compositions", async () => {
      const response = await app.request(`/api/compositions/by-shoot/${testShoot.id}`);
      expect(response.status).toBe(200);

      const data = await parseResponse<unknown[]>(response);
      expect(data).toHaveLength(0);
    });
  });

  describe("DELETE /api/compositions/by-id/:id", () => {
    test("deletes a composition", async () => {
      const createResponse = await app.request("/api/compositions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shootId: testShoot.id, name: "To Delete" }),
      });
      const created = await parseResponse<{ id: string }>(createResponse);

      const response = await app.request(`/api/compositions/by-id/${created?.id}`, {
        method: "DELETE",
      });
      expect(response.status).toBe(200);

      const data = await parseResponse<{ success: boolean }>(response);
      expect(data?.success).toBe(true);

      // Verify it's gone
      const getResponse = await app.request(`/api/compositions/by-id/${created?.id}`);
      expect(getResponse.status).toBe(404);
    });

    test("returns 404 for non-existent composition", async () => {
      const response = await app.request("/api/compositions/by-id/nonexistent", {
        method: "DELETE",
      });
      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/compositions/by-id/:id", () => {
    test("fetches a composition by ID", async () => {
      const createResponse = await app.request("/api/compositions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shootId: testShoot.id, name: "Fetch Test" }),
      });
      const created = await parseResponse<{ id: string }>(createResponse);

      const response = await app.request(`/api/compositions/by-id/${created?.id}`);
      expect(response.status).toBe(200);

      const data = await parseResponse<{ id: string; name: string }>(response);
      expect(data?.id).toBe(created?.id);
      expect(data?.name).toBe("Fetch Test");
    });

    test("returns 404 for non-existent composition", async () => {
      const response = await app.request("/api/compositions/by-id/nonexistent");
      expect(response.status).toBe(404);
    });
  });

  describe("Schema validation", () => {
    test("rejects update with invalid segment shape", async () => {
      const createResponse = await app.request("/api/compositions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shootId: testShoot.id, name: "Validate Me" }),
      });
      const created = await parseResponse<{ id: string }>(createResponse);

      const response = await app.request(`/api/compositions/by-id/${created?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segments: [{ invalid: "shape" }],
        }),
      });
      expect(response.status).toBe(422);
    });

    test("rejects create without required fields", async () => {
      const response = await app.request("/api/compositions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(response.status).toBe(422);
    });
  });

  describe("POST /api/compositions/by-id/:id/export", () => {
    test("exports a composition and returns MediaEdit array", async () => {
      // Create composition with segments and export regions
      const createResponse = await app.request("/api/compositions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shootId: testShoot.id, name: "Export Test" }),
      });
      const created = await parseResponse<{ id: string }>(createResponse);

      // Add segments (need a real media for FK)
      const { createTestMedia } = await import("../../test-utils/setup");
      const media = await createTestMedia();

      await app.request(`/api/compositions/by-id/${created?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segments: [
            { id: "seg-1", sourceMediaId: media.id, sourceStartFrame: 0, sourceEndFrame: 900 },
          ],
          tracks: [{ id: "t-1", name: "Overlays", operations: [] }],
          exportRegions: [
            { id: "er-1", startFrame: 0, endFrame: 450, package: "pkg", role: "main", contentRating: "sfw" },
          ],
        }),
      });

      const response = await app.request(`/api/compositions/by-id/${created?.id}/export`, {
        method: "POST",
      });
      expect(response.status).toBe(200);

      const edits = await parseResponse<{ id: string; compositionId: string; type: string; status: string }[]>(response);
      expect(edits).toHaveLength(1);
      expect(edits?.[0]?.compositionId).toBe(created?.id);
      expect(edits?.[0]?.type).toBe("composition");
      expect(edits?.[0]?.status).toBe("queued");
    });

    test("returns 404 for non-existent composition", async () => {
      const response = await app.request("/api/compositions/by-id/nonexistent/export", {
        method: "POST",
      });
      expect(response.status).toBe(404);
    });
  });

  describe("Shoot cascade", () => {
    test("deleting a shoot cascades to its compositions", async () => {
      // Create a composition on the test shoot
      const createResponse = await app.request("/api/compositions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shootId: testShoot.id, name: "Will Be Cascaded" }),
      });
      const created = await parseResponse<{ id: string }>(createResponse);

      // Delete the shoot directly
      const dataSource = getTestDataSource();
      const shootRepo = dataSource.getRepository(Shoot);
      await shootRepo.delete(testShoot.id);

      // The composition should be gone
      const getResponse = await app.request(`/api/compositions/by-id/${created?.id}`);
      expect(getResponse.status).toBe(404);
    });
  });
});
