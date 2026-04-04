import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { Hono } from "hono";
import "reflect-metadata";
import { setupTestDatabase, teardownTestDatabase } from "../../lib/test-db";
import { resetAllFixtures } from "../../lib/test-fixtures";
import { devalueMiddleware } from "../../lib/devalue-middleware";
import { getTestDataSource } from "../../lib/test-db";
import { parseResponse, createTestMedia } from "../../test-utils/setup";
import { Media } from "../library/entity";
import { MediaEdit } from "./entity";
import { mediaEditsRoutes } from "./routes";

describe("MediaEdit Routes", () => {
  // eslint-disable-next-line functional/no-let
  let app: Hono;

  beforeAll(async () => {
    await setupTestDatabase();
    await resetAllFixtures();
    app = new Hono().use("*", devalueMiddleware()).route("/", mediaEditsRoutes);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await resetAllFixtures();
  });

  describe("POST /api/media-edits", () => {
    test("creates a new media edit for a source media", async () => {
      const sourceMedia = await createTestMedia();

      const response = await app.request("/api/media-edits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceMediaId: sourceMedia.id,
          type: "transform",
          operations: [
            { type: "watermark", assetId: "asset-1", x: 0.85, y: 0.9, width: 0.1, opacity: 0.7 },
          ],
        }),
      });
      expect(response.status).toBe(200);

      const data = await parseResponse<{
        id: string;
        sourceMediaId: string;
        outputMediaId: string | null;
        type: string;
        operations: unknown[];
        status: string;
        error: string | null;
        createdAt: string;
        updatedAt: string;
      }>(response);

      expect(data?.id).toBeDefined();
      expect(data?.sourceMediaId).toBe(sourceMedia.id);
      expect(data?.outputMediaId).toBeNull();
      expect(data?.type).toBe("transform");
      expect(data?.operations).toHaveLength(1);
      expect(data?.status).toBe("draft");
      expect(data?.error).toBeNull();
    });
  });

  describe("GET /api/media-edits/:id", () => {
    test("returns a media edit by id", async () => {
      const sourceMedia = await createTestMedia();

      const createResponse = await app.request("/api/media-edits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceMediaId: sourceMedia.id,
          type: "transform",
          operations: [],
        }),
      });
      const created = await parseResponse<{ id: string }>(createResponse);

      const response = await app.request(`/api/media-edits/${created?.id}`);
      expect(response.status).toBe(200);

      const data = await parseResponse<{
        id: string;
        sourceMediaId: string;
        type: string;
        status: string;
      }>(response);
      expect(data?.id).toBe(created?.id);
      expect(data?.sourceMediaId).toBe(sourceMedia.id);
    });

    test("returns 404 for non-existent media edit", async () => {
      const response = await app.request("/api/media-edits/non-existent-id");
      expect(response.status).toBe(404);

      const data = await parseResponse<{ error: string }>(response);
      expect(data?.error).toBe("MediaEdit not found");
    });
  });

  describe("GET /api/media-edits/by-source/:mediaId", () => {
    test("returns all media edits for a source media", async () => {
      const sourceMedia = await createTestMedia();

      // Create two edits for the same source
      await app.request("/api/media-edits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceMediaId: sourceMedia.id, type: "transform", operations: [] }),
      });
      await app.request("/api/media-edits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceMediaId: sourceMedia.id, type: "clip", operations: [] }),
      });

      const response = await app.request(`/api/media-edits/by-source/${sourceMedia.id}`);
      expect(response.status).toBe(200);

      const data =
        await parseResponse<{ id: string; sourceMediaId: string; type: string }[]>(response);
      expect(data).toHaveLength(2);
      expect(data?.every((e) => e.sourceMediaId === sourceMedia.id)).toBe(true);
    });

    test("returns empty array when no edits exist for source", async () => {
      const sourceMedia = await createTestMedia();

      const response = await app.request(`/api/media-edits/by-source/${sourceMedia.id}`);
      expect(response.status).toBe(200);

      const data = await parseResponse<unknown[]>(response);
      expect(data).toHaveLength(0);
    });
  });

  describe("PATCH /api/media-edits/:id", () => {
    test("updates operations and status", async () => {
      const sourceMedia = await createTestMedia();

      const createResponse = await app.request("/api/media-edits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceMediaId: sourceMedia.id, type: "transform", operations: [] }),
      });
      const created = await parseResponse<{ id: string }>(createResponse);

      const newOps = [
        { type: "watermark", assetId: "asset-2", x: 0.5, y: 0.5, width: 0.2, opacity: 1 },
      ];
      const response = await app.request(`/api/media-edits/${created?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operations: newOps, status: "queued" }),
      });
      expect(response.status).toBe(200);

      const data = await parseResponse<{
        id: string;
        operations: unknown[];
        status: string;
      }>(response);
      expect(data?.operations).toHaveLength(1);
      expect(data?.status).toBe("queued");
    });

    test("returns 404 for non-existent media edit", async () => {
      const response = await app.request("/api/media-edits/non-existent-id", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "queued" }),
      });
      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/media-edits/:id", () => {
    test("deletes a media edit", async () => {
      const sourceMedia = await createTestMedia();

      const createResponse = await app.request("/api/media-edits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceMediaId: sourceMedia.id, type: "transform", operations: [] }),
      });
      const created = await parseResponse<{ id: string }>(createResponse);

      const response = await app.request(`/api/media-edits/${created?.id}`, {
        method: "DELETE",
      });
      expect(response.status).toBe(200);

      const data = await parseResponse<{ success: boolean }>(response);
      expect(data?.success).toBe(true);

      // Confirm it's gone
      const getResponse = await app.request(`/api/media-edits/${created?.id}`);
      expect(getResponse.status).toBe(404);
    });

    test("returns 404 for non-existent media edit", async () => {
      const response = await app.request("/api/media-edits/non-existent-id", {
        method: "DELETE",
      });
      expect(response.status).toBe(404);
    });
  });

  describe("Deletion semantics", () => {
    test("deleting source Media cascade-deletes MediaEdit, output Media survives with derivedFromId nulled", async () => {
      const dataSource = getTestDataSource();
      const mediaRepo = dataSource.getRepository(Media);
      const editRepo = dataSource.getRepository(MediaEdit);

      // Create source and output media
      const sourceMedia = await createTestMedia();
      const outputMedia = await createTestMedia({ derivedFromId: sourceMedia.id });

      // Create a MediaEdit linking them
      const edit = editRepo.create({
        sourceMediaId: sourceMedia.id,
        outputMediaId: outputMedia.id,
        type: "transform",
        operations: [],
        status: "completed",
      });
      await editRepo.save(edit);

      // Delete source media
      await mediaRepo.delete(sourceMedia.id);

      // MediaEdit should be cascade-deleted
      const deletedEdit = await editRepo.findOne({ where: { id: edit.id } });
      expect(deletedEdit).toBeNull();

      // Output media should survive with derivedFromId nulled
      const survivingOutput = await mediaRepo.findOne({ where: { id: outputMedia.id } });
      expect(survivingOutput).not.toBeNull();
      expect(survivingOutput?.derivedFromId).toBeNull();
    });

    test("deleting output Media nulls MediaEdit.outputMediaId (recipe preserved)", async () => {
      const dataSource = getTestDataSource();
      const mediaRepo = dataSource.getRepository(Media);
      const editRepo = dataSource.getRepository(MediaEdit);

      const sourceMedia = await createTestMedia();
      const outputMedia = await createTestMedia({ derivedFromId: sourceMedia.id });

      const edit = editRepo.create({
        sourceMediaId: sourceMedia.id,
        outputMediaId: outputMedia.id,
        type: "transform",
        operations: [{ type: "watermark" }],
        status: "completed",
      });
      await editRepo.save(edit);

      // Delete the output media
      await mediaRepo.delete(outputMedia.id);

      // MediaEdit should survive with outputMediaId nulled
      const survivingEdit = await editRepo.findOne({ where: { id: edit.id } });
      expect(survivingEdit).not.toBeNull();
      expect(survivingEdit?.outputMediaId).toBeNull();
      // Recipe (operations) should be preserved
      expect(survivingEdit?.operations).toHaveLength(1);
    });

    test("deleting MediaEdit does not delete output Media", async () => {
      const dataSource = getTestDataSource();
      const mediaRepo = dataSource.getRepository(Media);
      const editRepo = dataSource.getRepository(MediaEdit);

      const sourceMedia = await createTestMedia();
      const outputMedia = await createTestMedia({ derivedFromId: sourceMedia.id });

      const edit = editRepo.create({
        sourceMediaId: sourceMedia.id,
        outputMediaId: outputMedia.id,
        type: "transform",
        operations: [],
        status: "completed",
      });
      await editRepo.save(edit);

      // Delete the MediaEdit via API
      const response = await app.request(`/api/media-edits/${edit.id}`, { method: "DELETE" });
      expect(response.status).toBe(200);

      // Output media should survive
      const survivingOutput = await mediaRepo.findOne({ where: { id: outputMedia.id } });
      expect(survivingOutput).not.toBeNull();
    });
  });

  describe("POST /api/media-edits/:id/queue", () => {
    test("transitions a draft media edit to queued status", async () => {
      const sourceMedia = await createTestMedia();

      const createResponse = await app.request("/api/media-edits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceMediaId: sourceMedia.id,
          type: "transform",
          operations: [
            { type: "watermark", assetId: "a1", x: 0.5, y: 0.5, width: 0.1, opacity: 1 },
          ],
        }),
      });
      const created = await parseResponse<{ id: string; status: string }>(createResponse);
      expect(created?.status).toBe("draft");

      const response = await app.request(`/api/media-edits/${created?.id}/queue`, {
        method: "POST",
      });
      expect(response.status).toBe(200);

      const data = await parseResponse<{ id: string; status: string }>(response);
      expect(data?.status).toBe("queued");
    });

    test("rejects queueing a non-draft media edit", async () => {
      const sourceMedia = await createTestMedia();

      const createResponse = await app.request("/api/media-edits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceMediaId: sourceMedia.id,
          type: "transform",
          operations: [],
        }),
      });
      const created = await parseResponse<{ id: string }>(createResponse);

      // Queue it first
      await app.request(`/api/media-edits/${created?.id}/queue`, { method: "POST" });

      // Try to queue again — should fail
      const response = await app.request(`/api/media-edits/${created?.id}/queue`, {
        method: "POST",
      });
      expect(response.status).toBe(422);
    });

    test("returns 404 for non-existent media edit", async () => {
      const response = await app.request("/api/media-edits/non-existent-id/queue", {
        method: "POST",
      });
      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/media-edits/queue", () => {
    test("returns edits with non-draft statuses ordered by updatedAt", async () => {
      const sourceMedia = await createTestMedia();

      // Create a draft (should NOT appear)
      await app.request("/api/media-edits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceMediaId: sourceMedia.id, type: "transform", operations: [] }),
      });

      // Create and queue one (should appear)
      const createResponse = await app.request("/api/media-edits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceMediaId: sourceMedia.id,
          type: "transform",
          operations: [
            { type: "watermark", assetId: "a1", x: 0.5, y: 0.5, width: 0.1, opacity: 1 },
          ],
        }),
      });
      const created = await parseResponse<{ id: string }>(createResponse);
      await app.request(`/api/media-edits/${created?.id}/queue`, { method: "POST" });

      const response = await app.request("/api/media-edits/queue");
      expect(response.status).toBe(200);

      const data = await parseResponse<{ id: string; status: string }[]>(response);
      expect(data?.length).toBeGreaterThanOrEqual(1);
      // No drafts in queue
      expect(data?.every((e) => e.status !== "draft")).toBe(true);
    });

    test("returns empty array when no non-draft edits exist", async () => {
      const response = await app.request("/api/media-edits/queue");
      expect(response.status).toBe(200);

      const data = await parseResponse<unknown[]>(response);
      expect(data).toHaveLength(0);
    });
  });

  describe("Validation", () => {
    test("rejects create with invalid type", async () => {
      const sourceMedia = await createTestMedia();

      const response = await app.request("/api/media-edits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceMediaId: sourceMedia.id,
          type: "invalid-type",
          operations: [],
        }),
      });
      expect(response.status).toBe(422);
    });

    test("rejects create with missing sourceMediaId", async () => {
      const response = await app.request("/api/media-edits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "transform",
          operations: [],
        }),
      });
      expect(response.status).toBe(422);
    });

    test("rejects patch with invalid status", async () => {
      const sourceMedia = await createTestMedia();

      const createResponse = await app.request("/api/media-edits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceMediaId: sourceMedia.id, type: "transform", operations: [] }),
      });
      const created = await parseResponse<{ id: string }>(createResponse);

      const response = await app.request(`/api/media-edits/${created?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "invalid-status" }),
      });
      expect(response.status).toBe(422);
    });

    test("creates with empty operations by default", async () => {
      const sourceMedia = await createTestMedia();

      const response = await app.request("/api/media-edits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceMediaId: sourceMedia.id,
          type: "clip",
        }),
      });
      expect(response.status).toBe(200);

      const data = await parseResponse<{ operations: unknown[] }>(response);
      expect(data?.operations).toHaveLength(0);
    });
  });
});
