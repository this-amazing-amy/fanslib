import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { Hono } from "hono";
import { existsSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import "reflect-metadata";
import { setupTestDatabase, teardownTestDatabase } from "../../lib/test-db";
import { resetAllFixtures } from "../../lib/test-fixtures";
import { devalueMiddleware } from "../../lib/devalue-middleware";
import { parseResponse } from "../../test-utils/setup";
import { assetsRoutes } from "./routes";

// Use a temporary directory for test assets
const TEST_ASSETS_DIR = join(import.meta.dir, "..", "..", "..", "tests", "fixtures", "assets");

// Minimal valid PNG (1x1 pixel, transparent)
const VALID_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

describe("Assets Routes", () => {
  // eslint-disable-next-line functional/no-let
  let app: Hono;

  beforeAll(async () => {
    process.env.APPDATA_PATH = join(import.meta.dir, "..", "..", "..", "tests", "fixtures");
    await setupTestDatabase();
    await resetAllFixtures();
    app = new Hono().use("*", devalueMiddleware()).route("/", assetsRoutes);
    if (!existsSync(TEST_ASSETS_DIR)) mkdirSync(TEST_ASSETS_DIR, { recursive: true });
  });

  afterAll(async () => {
    await teardownTestDatabase();
    if (existsSync(TEST_ASSETS_DIR)) rmSync(TEST_ASSETS_DIR, { recursive: true, force: true });
  });

  beforeEach(async () => {
    await resetAllFixtures();
    // Clean assets directory between tests
    if (existsSync(TEST_ASSETS_DIR)) rmSync(TEST_ASSETS_DIR, { recursive: true, force: true });
    mkdirSync(TEST_ASSETS_DIR, { recursive: true });
  });

  describe("POST /api/assets/upload", () => {
    test("uploads a PNG asset and returns entity with name and type", async () => {
      const formData = new FormData();
      formData.append("file", new Blob([VALID_PNG], { type: "image/png" }), "watermark.png");
      formData.append("name", "My Watermark");

      const response = await app.request("/api/assets/upload", {
        method: "POST",
        body: formData,
      });
      expect(response.status).toBe(200);

      const data = await parseResponse<{
        id: string;
        name: string;
        type: string;
        filename: string;
        createdAt: string;
      }>(response);

      expect(data?.id).toBeDefined();
      expect(data?.name).toBe("My Watermark");
      expect(data?.type).toBe("image");
      expect(data?.filename).toBeDefined();
    });
  });

  describe("GET /api/assets", () => {
    test("returns all assets", async () => {
      // Upload an asset first
      const formData = new FormData();
      formData.append("file", new Blob([VALID_PNG], { type: "image/png" }), "test.png");
      formData.append("name", "Test Asset");
      await app.request("/api/assets/upload", { method: "POST", body: formData });

      const response = await app.request("/api/assets");
      expect(response.status).toBe(200);

      const data = await parseResponse<{ id: string; name: string; type: string }[]>(response);
      expect(data).toHaveLength(1);
      expect(data?.[0]?.name).toBe("Test Asset");
    });

    test("filters by type query parameter", async () => {
      // Upload an image asset
      const formData = new FormData();
      formData.append("file", new Blob([VALID_PNG], { type: "image/png" }), "test.png");
      formData.append("name", "Image Asset");
      await app.request("/api/assets/upload", { method: "POST", body: formData });

      const imageResponse = await app.request("/api/assets?type=image");
      const imageData = await parseResponse<{ type: string }[]>(imageResponse);
      expect(imageData).toHaveLength(1);

      const audioResponse = await app.request("/api/assets?type=audio");
      const audioData = await parseResponse<{ type: string }[]>(audioResponse);
      expect(audioData).toHaveLength(0);
    });
  });

  describe("GET /api/assets/:id/file", () => {
    test("streams the uploaded file", async () => {
      const formData = new FormData();
      formData.append("file", new Blob([VALID_PNG], { type: "image/png" }), "test.png");
      formData.append("name", "File Test");
      const createResponse = await app.request("/api/assets/upload", { method: "POST", body: formData });
      const created = await parseResponse<{ id: string }>(createResponse);

      const response = await app.request(`/api/assets/${created?.id}/file`);
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toContain("image/png");

      const body = await response.arrayBuffer();
      expect(body.byteLength).toBeGreaterThan(0);
    });

    test("returns 404 for non-existent asset", async () => {
      const response = await app.request("/api/assets/non-existent-id/file");
      expect(response.status).toBe(404);
    });
  });

  describe("PATCH /api/assets/:id", () => {
    test("renames an asset", async () => {
      const formData = new FormData();
      formData.append("file", new Blob([VALID_PNG], { type: "image/png" }), "test.png");
      formData.append("name", "Original Name");
      const createResponse = await app.request("/api/assets/upload", { method: "POST", body: formData });
      const created = await parseResponse<{ id: string }>(createResponse);

      const response = await app.request(`/api/assets/${created?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Name" }),
      });
      expect(response.status).toBe(200);

      const data = await parseResponse<{ id: string; name: string }>(response);
      expect(data?.name).toBe("New Name");
    });

    test("returns 404 for non-existent asset", async () => {
      const response = await app.request("/api/assets/non-existent-id", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Name" }),
      });
      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/assets/:id", () => {
    test("deletes asset entity and file from disk", async () => {
      const formData = new FormData();
      formData.append("file", new Blob([VALID_PNG], { type: "image/png" }), "test.png");
      formData.append("name", "To Delete");
      const createResponse = await app.request("/api/assets/upload", { method: "POST", body: formData });
      const created = await parseResponse<{ id: string; filename: string }>(createResponse);

      // File should exist after upload
      const filePath = join(TEST_ASSETS_DIR, created?.filename ?? "");
      expect(existsSync(filePath)).toBe(true);

      const response = await app.request(`/api/assets/${created?.id}`, { method: "DELETE" });
      expect(response.status).toBe(200);

      const data = await parseResponse<{ success: boolean }>(response);
      expect(data?.success).toBe(true);

      // File should be removed from disk
      expect(existsSync(filePath)).toBe(false);

      // Entity should be gone
      const getResponse = await app.request("/api/assets");
      const assets = await parseResponse<unknown[]>(getResponse);
      expect(assets).toHaveLength(0);
    });

    test("returns 404 for non-existent asset", async () => {
      const response = await app.request("/api/assets/non-existent-id", { method: "DELETE" });
      expect(response.status).toBe(404);
    });
  });

  describe("Upload validation", () => {
    test("rejects non-PNG files", async () => {
      const formData = new FormData();
      formData.append("file", new Blob(["not a png"], { type: "text/plain" }), "test.txt");
      formData.append("name", "Invalid");

      const response = await app.request("/api/assets/upload", { method: "POST", body: formData });
      expect(response.status).toBe(422);

      const data = await parseResponse<{ error: string }>(response);
      expect(data?.error).toContain("PNG");
    });
  });

  describe("Audio upload", () => {
    // MP3 magic bytes: ID3 header or 0xFF 0xFB sync word
    const VALID_MP3 = Buffer.from([0x49, 0x44, 0x33, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);

    test("uploads an MP3 audio asset with type audio", async () => {
      const formData = new FormData();
      formData.append("file", new Blob([VALID_MP3], { type: "audio/mpeg" }), "track.mp3");
      formData.append("name", "My Track");

      const response = await app.request("/api/assets/upload", { method: "POST", body: formData });
      expect(response.status).toBe(200);

      const data = await parseResponse<{ id: string; name: string; type: string }>(response);
      expect(data?.type).toBe("audio");
      expect(data?.name).toBe("My Track");
    });

    test("audio assets appear in type=audio filter", async () => {
      const formData = new FormData();
      formData.append("file", new Blob([VALID_MP3], { type: "audio/mpeg" }), "track.mp3");
      formData.append("name", "Audio Track");
      await app.request("/api/assets/upload", { method: "POST", body: formData });

      const audioResponse = await app.request("/api/assets?type=audio");
      const audioData = await parseResponse<{ type: string }[]>(audioResponse);
      expect(audioData).toHaveLength(1);
      expect(audioData?.[0]?.type).toBe("audio");

      // Should NOT appear in image filter
      const imageResponse = await app.request("/api/assets?type=image");
      const imageData = await parseResponse<{ type: string }[]>(imageResponse);
      expect(imageData).toHaveLength(0);
    });

    test("rejects unsupported audio formats", async () => {
      const formData = new FormData();
      formData.append("file", new Blob(["not audio"], { type: "audio/ogg" }), "track.ogg");
      formData.append("name", "Bad Audio");

      const response = await app.request("/api/assets/upload", { method: "POST", body: formData });
      expect(response.status).toBe(422);
    });

    test("file streaming returns correct content-type for audio", async () => {
      const formData = new FormData();
      formData.append("file", new Blob([VALID_MP3], { type: "audio/mpeg" }), "track.mp3");
      formData.append("name", "Stream Test");
      const createResponse = await app.request("/api/assets/upload", { method: "POST", body: formData });
      const created = await parseResponse<{ id: string }>(createResponse);

      const fileResponse = await app.request(`/api/assets/${created?.id}/file`);
      expect(fileResponse.status).toBe(200);
      // Should return audio content type, not image/png
      const contentType = fileResponse.headers.get("Content-Type");
      expect(contentType).not.toContain("image/png");
    });
  });
});
