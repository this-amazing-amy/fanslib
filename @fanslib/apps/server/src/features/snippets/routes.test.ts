import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { Elysia } from "elysia";
import "reflect-metadata";
import { getTestDataSource, resetAllFixtures, setupTestDatabase, teardownTestDatabase } from "../../lib/db.test";
import { serializeJson } from "../../lib/serialize-json";
import { CaptionSnippet } from "./entity";
import { CAPTION_SNIPPET_FIXTURES } from "./fixtures";
import { snippetsRoutes } from "./routes";

describe("Snippets Routes", () => {
  // eslint-disable-next-line functional/no-let
  let app: Elysia;
  // eslint-disable-next-line functional/no-let
  let fixtures: Awaited<ReturnType<typeof resetAllFixtures>>;

  beforeAll(async () => {
    await setupTestDatabase();
    fixtures = await resetAllFixtures();
    app = new Elysia().mapResponse(serializeJson).use(snippetsRoutes);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    fixtures = await resetAllFixtures();
  });

  describe("GET /api/snippets", () => {
    test("returns all snippets", async () => {
      const response = await app.handle(new Request("http://localhost/api/snippets"));
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(CAPTION_SNIPPET_FIXTURES.length);
      
      CAPTION_SNIPPET_FIXTURES.forEach((fixture) => {
        const snippet = data.find((s: CaptionSnippet) => s.id === fixture.id);
        expect(snippet).toBeDefined();
        expect(snippet?.name).toBe(fixture.name);
        expect(snippet?.content).toBe(fixture.content);
      });
    });
  });

  describe("GET /api/snippets/global", () => {
    test("returns only global snippets", async () => {
      const response = await app.handle(new Request("http://localhost/api/snippets/global"));
      const data = await response.json();

      expect(Array.isArray(data)).toBe(true);
      data.forEach((snippet: CaptionSnippet) => {
        expect(snippet.channelId).toBeFalsy();
      });
    });
  });

  describe("GET /api/snippets/by-channel/:channelId", () => {
    test("returns snippets for specific channel", async () => {
      const fixtureChannel = fixtures.channels.channels[0];
      if (!fixtureChannel) {
        throw new Error("No channel fixtures available");
      }

      const response = await app.handle(
        new Request(`http://localhost/api/snippets/by-channel/${fixtureChannel.id}`)
      );
      const data = await response.json();

      expect(Array.isArray(data)).toBe(true);
      data.forEach((snippet: CaptionSnippet) => {
        expect(!snippet.channelId || snippet.channelId === fixtureChannel.id).toBe(true);
      });
    });
  });

  describe("GET /api/snippets/:id", () => {
    test("returns snippet by id", async () => {
      const fixtureSnippet = CAPTION_SNIPPET_FIXTURES[0];
      if (!fixtureSnippet) {
        throw new Error("No snippet fixtures available");
      }

      const response = await app.handle(
        new Request(`http://localhost/api/snippets/${fixtureSnippet.id}`)
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.id).toBe(fixtureSnippet.id);
      expect(data.name).toBe(fixtureSnippet.name);
    });

    test("returns error for non-existent snippet", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/snippets/non-existent-id")
      );

      const data = await response.json();
      expect(data).toHaveProperty("error");
      expect(data.error).toBe("Snippet not found");
    });
  });

  describe("POST /api/snippets", () => {
    test("creates a new snippet", async () => {
      const snippetData = {
        name: "New Snippet",
        content: "This is a new snippet",
        isGlobal: false,
      };

      const response = await app.handle(
        new Request("http://localhost/api/snippets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(snippetData),
        })
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.name).toBe("New Snippet");
      expect(data.content).toBe("This is a new snippet");
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
        isGlobal: false,
      };

      const response = await app.handle(
        new Request("http://localhost/api/snippets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(snippetData),
        })
      );

      const data = await response.json();
      expect(data.channelId).toBe(channel.id);
    });
  });

  describe("PATCH /api/snippets/:id", () => {
    test("updates snippet", async () => {
      const fixtureSnippet = CAPTION_SNIPPET_FIXTURES[0];
      if (!fixtureSnippet) {
        throw new Error("No snippet fixtures available");
      }

      const updateData = {
        name: "Updated Snippet",
        content: "Updated content",
      };

      const response = await app.handle(
        new Request(`http://localhost/api/snippets/${fixtureSnippet.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        })
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.name).toBe("Updated Snippet");
      expect(data.content).toBe("Updated content");
      expect(data.id).toBe(fixtureSnippet.id);
    });
  });

  describe("DELETE /api/snippets/:id", () => {
    test("deletes snippet", async () => {
      const fixtureSnippet = CAPTION_SNIPPET_FIXTURES[CAPTION_SNIPPET_FIXTURES.length - 1];
      if (!fixtureSnippet) {
        throw new Error("No snippet fixtures available");
      }

      const response = await app.handle(
        new Request(`http://localhost/api/snippets/${fixtureSnippet.id}`, {
          method: "DELETE",
        })
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);

      const dataSource = getTestDataSource();
      const repository = dataSource.getRepository(CaptionSnippet);
      const deletedSnippet = await repository.findOne({ where: { id: fixtureSnippet.id } });
      expect(deletedSnippet).toBeNull();
    });
  });

});

