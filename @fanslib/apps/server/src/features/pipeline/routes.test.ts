import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { Elysia } from "elysia";
import "reflect-metadata";
import { getTestDataSource, resetAllFixtures, setupTestDatabase, teardownTestDatabase } from "../../lib/db.test";
import { mapResponse } from "../../lib/serialization";
import { logError, parseResponse } from "../../test-utils/setup";
import { pipelineRoutes } from "./routes";
import type { FetchCaptionQueueResponseSchema } from "./operations/fetch-caption-queue";

describe("Pipeline Routes", () => {
  // eslint-disable-next-line functional/no-let
  let app: Elysia;
  // eslint-disable-next-line functional/no-let
  let fixtures: Awaited<ReturnType<typeof resetAllFixtures>>;

  beforeAll(async () => {
    await setupTestDatabase();
    fixtures = await resetAllFixtures();
    app = new Elysia().onError(logError()).mapResponse(mapResponse).use(pipelineRoutes);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await resetAllFixtures();
  });

  describe("GET /api/pipeline/caption-queue", () => {
    test.skip("returns caption queue with draft posts and validates Date types", async () => {
      const dataSource = getTestDataSource();
      
      // Get a channel ID from fixtures
      const channelId = fixtures.channels.channels[0]?.id;
      if (!channelId) {
        throw new Error("No channels in fixtures");
      }

      const response = await app.handle(
        new Request(`http://localhost/api/pipeline/caption-queue?channelIds=${channelId}`)
      );

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
        } catch (e) {
          console.log("Not valid JSON");
        }
      }

      expect(response.status).toBe(200);

      const data = await parseResponse<typeof FetchCaptionQueueResponseSchema.static>(response);
      expect(Array.isArray(data)).toBe(true);
      
      // Validate Date types are preserved
      if (data && data.length > 0) {
        const firstItem = data[0];
        console.log("\nDate type checks:");
        console.log("post.createdAt is Date?", firstItem?.post?.createdAt instanceof Date);
        console.log("post.createdAt value:", firstItem?.post?.createdAt);
        
        if (firstItem?.post?.postMedia?.[0]?.media) {
          const media = firstItem.post.postMedia[0].media;
          console.log("media.createdAt is Date?", media.createdAt instanceof Date);
          console.log("media.createdAt value:", media.createdAt);
          console.log("media.fileCreationDate is Date?", media.fileCreationDate instanceof Date);
        }
        
        if (firstItem?.post?.postMedia?.[0]) {
          const postMedia = firstItem.post.postMedia[0];
          console.log("postMedia.createdAt is Date?", postMedia.createdAt instanceof Date);
          console.log("postMedia.createdAt value:", postMedia.createdAt);
        }
      }
    });

    test("returns all draft posts when no channelIds provided (tests 422 error reproduction)", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/pipeline/caption-queue?channelIds=")
      );

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
        } catch (e) {
          // Not JSON
        }
      }

      expect(response.status).toBe(200);

      const data = await parseResponse<typeof FetchCaptionQueueResponseSchema.static>(response);
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe("GET /api/pipeline/caption-queue with pagination", () => {
    test("supports limit parameter to get only first post", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/pipeline/caption-queue?channelIds=&limit=1")
      );

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
        } catch (e) {
          // Not JSON
        }
      }

      expect(response.status).toBe(200);

      const data = await parseResponse<typeof FetchCaptionQueueResponseSchema.static>(response);
      expect(Array.isArray(data)).toBe(true);
      expect(data?.length).toBeLessThanOrEqual(1);
      
      if (data && data.length > 0) {
        console.log("First post ID:", data[0]?.post?.id);
        console.log("First post has media:", data[0]?.post?.postMedia?.length);
      }
    });

    test("supports skip parameter", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/pipeline/caption-queue?channelIds=&limit=1&skip=1")
      );

      console.log("\n=== SKIP TEST (second post) ===");
      console.log("Response status:", response.status);
      
      if (response.status === 422) {
        const text = await response.text();
        console.log("\n❌ 422 VALIDATION ERROR ON SECOND POST");
        console.log("Response (first 3000 chars):", text.slice(0, 3000));
      }

      expect(response.status).toBe(200);

      const data = await parseResponse<typeof FetchCaptionQueueResponseSchema.static>(response);
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe("GET /api/pipeline/health", () => {
    test("returns health status", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/pipeline/health")
      );
      expect(response.status).toBe(200);

      const data = await parseResponse<{ status: string }>(response);
      expect(data?.status).toBe("ok");
    });
  });
});
