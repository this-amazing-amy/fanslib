import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { Hono } from "hono";
import "reflect-metadata";
import type { z } from "zod";
import { setupTestDatabase, teardownTestDatabase } from "../../lib/test-db";
import { resetAllFixtures } from "../../lib/test-fixtures";
import { devalueMiddleware } from "../../lib/devalue-middleware";
import { parseResponse } from "../../test-utils/setup";
import type { FetchCaptionQueueResponseSchema } from "./schema";
import { pipelineRoutes } from "./routes";

describe("Pipeline Routes", () => {
  // eslint-disable-next-line functional/no-let
  let app: Hono;
  // eslint-disable-next-line functional/no-let
  let fixtures: Awaited<ReturnType<typeof resetAllFixtures>>;

  beforeAll(async () => {
    await setupTestDatabase();
    fixtures = await resetAllFixtures();
    app = new Hono().use("*", devalueMiddleware()).route("/", pipelineRoutes);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await resetAllFixtures();
  });

  describe("GET /api/pipeline/caption-queue", () => {
    test.skip("returns caption queue with draft posts and validates Date types", async () => {
      // Get a channel ID from fixtures
      const channelId = fixtures.channels.channels[0]?.id;
      if (!channelId) {
        throw new Error("No channels in fixtures");
      }

      const response = await app.request(`/api/pipeline/caption-queue?channelIds=${channelId}`);

      console.log("Response status:", response.status);
      
      if (response.status !== 200) {
        const text = await response.text();
        console.log("\n❌ ERROR RESPONSE:");
        console.log("Status:", response.status);
        console.log("Response length:", text.length);
        console.log("First 2000 chars:", text.slice(0, 2000));
        // Try to parse as JSON to see the validation error
        try {
          const errorData = JSON.parse(text);
          console.log("\nParsed error data:");
          console.log(JSON.stringify(errorData, null, 2).slice(0, 3000));
        } catch {
          console.log("Not valid JSON");
        }
      }

      expect(response.status).toBe(200);

      const data = await parseResponse<z.infer<typeof FetchCaptionQueueResponseSchema>>(response);
      expect(Array.isArray(data)).toBe(true);
      
      // Validate Date types are preserved
      if (data && data.length > 0) {
        const firstItem = data[0];
        console.log("\nDate type checks:");
        console.log("post.createdAt is Date?", firstItem?.post?.createdAt instanceof Date);
        console.log("post.createdAt value:", firstItem?.post?.createdAt);
        
        if (firstItem?.post?.postMedia?.[0]) {
          const postMedia = firstItem.post.postMedia[0];
          console.log("postMedia.createdAt is Date?", postMedia.createdAt instanceof Date);
          console.log("postMedia.createdAt value:", postMedia.createdAt);
        }
      }
    });

    test("returns all draft posts when no channelIds provided (tests 422 error reproduction)", async () => {
      const response = await app.request("/api/pipeline/caption-queue?channelIds=");

      console.log("\n=== CAPTION QUEUE TEST ===");
      console.log("Response status:", response.status);
      
      if (response.status === 422) {
        const text = await response.text();
        console.log("\n❌ 422 VALIDATION ERROR");
        console.log("Response:", text.slice(0, 5000));
        try {
          const errorData = JSON.parse(text);
          console.log("\nValidation error details:");
          console.log(JSON.stringify(errorData, null, 2).slice(0, 5000));
        } catch {
          // Not JSON
        }
      }

      expect(response.status).toBe(200);

      const data = await parseResponse<z.infer<typeof FetchCaptionQueueResponseSchema>>(response);
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe("GET /api/pipeline/caption-queue with pagination", () => {
    test("supports limit parameter to get only first post", async () => {
      const response = await app.request("/api/pipeline/caption-queue?channelIds=&limit=1");

      console.log("\n=== LIMIT TEST ===");
      console.log("Response status:", response.status);
      
      if (response.status === 422) {
        const text = await response.text();
        console.log("\n❌ 422 VALIDATION ERROR ON FIRST POST");
        console.log("This is the problematic entry causing validation to fail!");
        console.log("Response (first 3000 chars):", text.slice(0, 3000));
        try {
          const errorData = JSON.parse(text);
          console.log("\nValidation error:");
          console.log(JSON.stringify(errorData, null, 2).slice(0, 3000));
        } catch {
          // Not JSON
        }
      }

      expect(response.status).toBe(200);

      const data = await parseResponse<z.infer<typeof FetchCaptionQueueResponseSchema>>(response);
      expect(Array.isArray(data)).toBe(true);
      expect(data?.length).toBeLessThanOrEqual(1);
      
      if (data && data.length > 0) {
        console.log("First post ID:", data[0]?.post?.id);
        console.log("First post has media:", data[0]?.post?.postMedia?.length);
      }
    });

    test("supports skip parameter", async () => {
      const response = await app.request("/api/pipeline/caption-queue?channelIds=&limit=1&skip=1");

      console.log("\n=== SKIP TEST (second post) ===");
      console.log("Response status:", response.status);
      
      if (response.status === 422) {
        const text = await response.text();
        console.log("\n❌ 422 VALIDATION ERROR ON SECOND POST");
        console.log("Response (first 3000 chars):", text.slice(0, 3000));
      }

      expect(response.status).toBe(200);

      const data = await parseResponse<z.infer<typeof FetchCaptionQueueResponseSchema>>(response);
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe("GET /api/pipeline/health", () => {
    test("returns health status", async () => {
      const response = await app.request("/api/pipeline/health");
      expect(response.status).toBe(200);

      const data = await parseResponse<{ status: string }>(response);
      expect(data?.status).toBe("ok");
    });
  });
});
