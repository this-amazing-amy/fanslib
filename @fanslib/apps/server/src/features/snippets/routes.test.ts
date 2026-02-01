import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { Hono } from "hono";
import type { z } from "zod";
import "reflect-metadata";
import { getTestDataSource, setupTestDatabase, teardownTestDatabase } from "../../lib/test-db";
import { resetAllFixtures } from "../../lib/test-fixtures";
import { devalueMiddleware } from "../../lib/devalue-middleware";
import { parseResponse } from "../../test-utils/setup";
import { CaptionSnippet } from "./entity";
import { CAPTION_SNIPPET_FIXTURES } from "./fixtures-data";
import type { CreateSnippetResponseSchema } from "./operations/snippet/create";
import { snippetsRoutes } from "./routes";

describe("Snippets Routes", () => {
  // eslint-disable-next-line functional/no-let
  let app: Hono;
  // eslint-disable-next-line functional/no-let
  let fixtures: Awaited<ReturnType<typeof resetAllFixtures>>;

  beforeAll(async () => {
    await setupTestDatabase();
    fixtures = await resetAllFixtures();
    app = new Hono()
      .use("*", devalueMiddleware())
      .route("/", snippetsRoutes);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    fixtures = await resetAllFixtures();
  });

  describe("GET /api/snippets/all", () => {
    test("returns all snippets", async () => {
      const response = await app.request("/api/snippets/all");
      expect(response.status).toBe(200);
      
      const data = await parseResponse<CaptionSnippet[]>(response);
      expect(Array.isArray(data)).toBe(true);
      expect(data?.length).toBeGreaterThanOrEqual(CAPTION_SNIPPET_FIXTURES.length);
      
      CAPTION_SNIPPET_FIXTURES.forEach((fixture) => {
        const snippet = data?.find((s: CaptionSnippet) => s.id === fixture.id);
        expect(snippet).toBeDefined();
        expect(snippet?.name).toBe(fixture.name);
        expect(snippet?.content).toBe(fixture.content);
      });
    });
  });

  describe("GET /api/snippets/global", () => {
    test("returns only global snippets", async () => {
      const response = await app.request("/api/snippets/global");
      const data = await parseResponse<CaptionSnippet[]>(response);

      expect(Array.isArray(data)).toBe(true);
      data?.forEach((snippet: CaptionSnippet) => {
        expect(snippet.channelId).toBeFalsy();
      });
    });
  });

  describe("GET /api/snippets/by-channel-id/:channelId", () => {
    test("returns snippets for specific channel", async () => {
      const fixtureChannel = fixtures.channels.channels[0];
      if (!fixtureChannel) {
        throw new Error("No channel fixtures available");
      }

      const response = await app.request(`/api/snippets/by-channel-id/${fixtureChannel.id}`);
      const data = await parseResponse<CaptionSnippet[]>(response);

      expect(Array.isArray(data)).toBe(true);
      data?.forEach((snippet: CaptionSnippet) => {
        expect(!snippet.channelId || snippet.channelId === fixtureChannel.id).toBe(true);
      });
    });
  });

  describe("GET /api/snippets/by-id/:id", () => {
    test("returns snippet by id", async () => {
      const fixtureSnippet = CAPTION_SNIPPET_FIXTURES[0];
      if (!fixtureSnippet) {
        throw new Error("No snippet fixtures available");
      }

      const response = await app.request(`/api/snippets/by-id/${fixtureSnippet.id}`);
      expect(response.status).toBe(200);

      const data = await parseResponse<CaptionSnippet>(response);
      expect(data?.id).toBe(fixtureSnippet.id);
      expect(data?.name).toBe(fixtureSnippet.name);
    });

    test("returns error for non-existent snippet", async () => {
      const response = await app.request("/api/snippets/by-id/non-existent-id");

      const data = await parseResponse<{ error: string }>(response);
      expect(data).toHaveProperty("error");
      expect(data?.error).toBe("Snippet not found");
    });
  });

  describe("POST /api/snippets", () => {
    test("creates a new snippet", async () => {
      const snippetData = {
        name: "New Snippet",
        content: "This is a new snippet",
      };

      const response = await app.request("/api/snippets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snippetData),
      });
      expect(response.status).toBe(200);

      const data = await parseResponse<CaptionSnippet>(response);
      expect(data?.name).toBe("New Snippet");
      expect(data?.content).toBe("This is a new snippet");
    });

    test("creates a channel-specific snippet", async () => {
      const channel = fixtures.channels.channels[0];
      if (!channel) {
        throw new Error("No channel fixtures available");
      }

      const snippetData = {
        name: "Channel Snippet",
        content: "Channel-specific content",
        channelId: channel.id,
      };

      const response = await app.request("/api/snippets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snippetData),
      });

      const data = await parseResponse<z.infer<typeof CreateSnippetResponseSchema>>(response);
      expect(data?.channel?.id).toBe(channel.id);
    });
  });

  describe("PATCH /api/snippets/by-id/:id", () => {
    test("updates snippet", async () => {
      const fixtureSnippet = CAPTION_SNIPPET_FIXTURES[0];
      if (!fixtureSnippet) {
        throw new Error("No snippet fixtures available");
      }

      const updateData = {
        name: "Updated Snippet",
        content: "Updated content",
      };

      const response = await app.request(`/api/snippets/by-id/${fixtureSnippet.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      expect(response.status).toBe(200);

      const data = await parseResponse<CaptionSnippet>(response);
      expect(data?.name).toBe("Updated Snippet");
      expect(data?.content).toBe("Updated content");
      expect(data?.id).toBe(fixtureSnippet.id);
    });
  });

  describe("DELETE /api/snippets/by-id/:id", () => {
    test("deletes snippet", async () => {
      const fixtureSnippet = CAPTION_SNIPPET_FIXTURES[CAPTION_SNIPPET_FIXTURES.length - 1];
      if (!fixtureSnippet) {
        throw new Error("No snippet fixtures available");
      }

      const response = await app.request(`/api/snippets/by-id/${fixtureSnippet.id}`, {
        method: "DELETE",
      });
      expect(response.status).toBe(200);

      const data = await parseResponse<{ success: boolean }>(response);
      expect(data?.success).toBe(true);

      const dataSource = getTestDataSource();
      const repository = dataSource.getRepository(CaptionSnippet);
      const deletedSnippet = await repository.findOne({ where: { id: fixtureSnippet.id } });
      expect(deletedSnippet).toBeNull();
    });

    test("returns 404 when snippet not found", async () => {
      const response = await app.request("/api/snippets/by-id/non-existent-id", {
        method: "DELETE",
      });
      expect(response.status).toBe(404);

      const data = await parseResponse<{ error: string }>(response);
      expect(data?.error).toBe("Snippet not found");
    });
  });

});

