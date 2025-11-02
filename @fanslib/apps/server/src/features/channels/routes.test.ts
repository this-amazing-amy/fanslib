import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { Elysia } from "elysia";
import "reflect-metadata";
import { getTestDataSource, resetAllFixtures, setupTestDatabase, teardownTestDatabase } from "../../lib/db.test";
import { serializeJson } from "../../lib/serialize-json";
import type { ChannelType } from "./entity";
import { Channel } from "./entity";
import { CHANNEL_FIXTURES } from "./fixtures";
import { channelsRoutes } from "./routes";

describe("Channels Routes", () => {
  // eslint-disable-next-line functional/no-let
  let app: Elysia;
  // eslint-disable-next-line functional/no-let
  let fixtures: Awaited<ReturnType<typeof resetAllFixtures>>;

  beforeAll(async () => {
    await setupTestDatabase();
    fixtures = await resetAllFixtures();
    app = new Elysia().mapResponse(serializeJson).use(channelsRoutes);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    fixtures = await resetAllFixtures();
  });

  describe("GET /api/channels", () => {
    test("returns all channels", async () => {
      const response = await app.handle(new Request("http://localhost/api/channels"));
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(CHANNEL_FIXTURES.length);
      
      CHANNEL_FIXTURES.forEach((fixture) => {
        const channel = data.find((c: Channel) => c.id === fixture.id);
        expect(channel).toBeDefined();
        expect(channel?.name).toBe(fixture.name);
        expect(channel?.typeId).toBe(fixture.typeId);
      });
    });
  });

  describe("GET /api/channels/types", () => {
    test("returns channel types", async () => {
      const response = await app.handle(new Request("http://localhost/api/channels/types"));
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      
      expect(fixtures.channels.channelTypes.length).toBeGreaterThan(0);
      fixtures.channels.channelTypes.forEach((type) => {
        const found = data.find((t: ChannelType) => t.id === type.id);
        expect(found).toBeDefined();
        expect(found?.name).toBe(type.name);
      });
    });
  });

  describe("GET /api/channels/:id", () => {
    test("returns channel by id", async () => {
      const fixtureChannel = CHANNEL_FIXTURES[0];
      if (!fixtureChannel) {
        throw new Error("No channel fixtures available");
      }

      const response = await app.handle(
        new Request(`http://localhost/api/channels/${fixtureChannel.id}`)
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.id).toBe(fixtureChannel.id);
      expect(data.name).toBe(fixtureChannel.name);
      expect(data.typeId).toBe(fixtureChannel.typeId);
    });

    test("returns error for non-existent channel", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/channels/non-existent-id")
      );

      const data = await response.json();
      expect(data).toHaveProperty("error");
      expect(data.error).toBe("Channel not found");
    });
  });

  describe("POST /api/channels", () => {
    test("creates a new channel", async () => {
      const channelData = {
        name: "New Channel",
        typeId: "fansly",
      };

      const response = await app.handle(
        new Request("http://localhost/api/channels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(channelData),
        })
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.name).toBe("New Channel");
      expect(data.typeId).toBe("fansly");
      expect(data.type).toBeDefined();
      expect(data.type.id).toBe("fansly");
    });
  });

  describe("PATCH /api/channels/:id", () => {
    test("updates channel", async () => {
      const fixtureChannel = CHANNEL_FIXTURES[0];
      if (!fixtureChannel) {
        throw new Error("No channel fixtures available");
      }

      const updateData = {
        name: "Updated Name",
      };

      const response = await app.handle(
        new Request(`http://localhost/api/channels/${fixtureChannel.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        })
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.name).toBe("Updated Name");
      expect(data.id).toBe(fixtureChannel.id);
    });

    test("returns error for non-existent channel", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/channels/non-existent-id", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Updated" }),
        })
      );

      const data = await response.json();
      expect(data).toHaveProperty("error");
    });
  });

  describe("DELETE /api/channels/:id", () => {
    test("deletes channel", async () => {
      const fixtureChannel = CHANNEL_FIXTURES[CHANNEL_FIXTURES.length - 1];
      if (!fixtureChannel) {
        throw new Error("No channel fixtures available");
      }

      const response = await app.handle(
        new Request(`http://localhost/api/channels/${fixtureChannel.id}`, {
          method: "DELETE",
        })
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);

      const dataSource = getTestDataSource();
      const repository = dataSource.getRepository(Channel);
      const deletedChannel = await repository.findOne({ where: { id: fixtureChannel.id } });
      expect(deletedChannel).toBeNull();
    });
  });
});

