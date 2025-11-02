import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { Elysia } from "elysia";
import "reflect-metadata";
import { getTestDataSource, resetAllFixtures, setupTestDatabase, teardownTestDatabase } from "../../lib/db.test";
import { serializeJson } from "../../lib/serialize-json";
import { ContentSchedule } from "./entity";
import { CONTENT_SCHEDULE_FIXTURES } from "./fixtures";
import { contentSchedulesRoutes } from "./routes";

describe("Content Schedules Routes", () => {
  // eslint-disable-next-line functional/no-let
  let app: Elysia;
  // eslint-disable-next-line functional/no-let
  let fixtures: Awaited<ReturnType<typeof resetAllFixtures>>;

  beforeAll(async () => {
    await setupTestDatabase();
    fixtures = await resetAllFixtures();
    app = new Elysia().mapResponse(serializeJson).use(contentSchedulesRoutes);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    fixtures = await resetAllFixtures();
  });

  describe("GET /api/content-schedules", () => {
    test("returns all content schedules", async () => {
      const response = await app.handle(new Request("http://localhost/api/content-schedules"));
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(CONTENT_SCHEDULE_FIXTURES.length);
      
      CONTENT_SCHEDULE_FIXTURES.forEach((fixture) => {
        const schedule = data.find((s: ContentSchedule) => s.id === fixture.id);
        expect(schedule).toBeDefined();
        expect(schedule?.channelId).toBe(fixture.channelId);
        expect(schedule?.type).toBe(fixture.type);
      });
    });
  });

  describe("GET /api/content-schedules/:id", () => {
    test("returns content schedule by id", async () => {
      const fixtureSchedule = CONTENT_SCHEDULE_FIXTURES[0];
      if (!fixtureSchedule) {
        throw new Error("No content schedule fixtures available");
      }

      const response = await app.handle(
        new Request(`http://localhost/api/content-schedules/${fixtureSchedule.id}`)
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.id).toBe(fixtureSchedule.id);
      expect(data.channelId).toBe(fixtureSchedule.channelId);
      expect(data.type).toBe(fixtureSchedule.type);
    });

    test("returns error for non-existent schedule", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/content-schedules/non-existent-id")
      );

      const data = await response.json();
      expect(data).toHaveProperty("error");
      expect(data.error).toBe("Content schedule not found");
    });
  });

  describe("GET /api/content-schedules/by-channel/:channelId", () => {
    test("returns schedules for specific channel", async () => {
      const fixtureChannel = fixtures.channels.channels[0];
      if (!fixtureChannel) {
        throw new Error("No channel fixtures available");
      }

      const response = await app.handle(
        new Request(`http://localhost/api/content-schedules/by-channel/${fixtureChannel.id}`)
      );
      const data = await response.json();

      expect(Array.isArray(data)).toBe(true);
      data.forEach((schedule: ContentSchedule) => {
        expect(schedule.channelId).toBe(fixtureChannel.id);
      });
    });
  });

  describe("POST /api/content-schedules", () => {
    test("creates a new content schedule", async () => {
      const channel = fixtures.channels.channels[0];
      if (!channel) {
        throw new Error("No channel fixtures available");
      }

      const scheduleData = {
        channelId: channel.id,
        type: "daily",
        postsPerTimeframe: 2,
        preferredTimes: ["14:30"],
      };

      const response = await app.handle(
        new Request("http://localhost/api/content-schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(scheduleData),
        })
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.type).toBe("daily");
      expect(data.channelId).toBe(channel.id);
    });
  });

  describe("PATCH /api/content-schedules/:id", () => {
    test("updates content schedule", async () => {
      const fixtureSchedule = CONTENT_SCHEDULE_FIXTURES[0];
      if (!fixtureSchedule) {
        throw new Error("No content schedule fixtures available");
      }

      const updateData = {
        preferredTimes: ["16:00"],
      };

      const response = await app.handle(
        new Request(`http://localhost/api/content-schedules/${fixtureSchedule.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        })
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data.preferredTimes)).toBe(true);
      expect(data.id).toBe(fixtureSchedule.id);
    });

    test("returns error for non-existent schedule", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/content-schedules/non-existent-id", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ time: "12:00" }),
        })
      );

      const data = await response.json();
      expect(data).toHaveProperty("error");
    });
  });

  describe("DELETE /api/content-schedules/:id", () => {
    test("deletes content schedule", async () => {
      const fixtureSchedule = CONTENT_SCHEDULE_FIXTURES[CONTENT_SCHEDULE_FIXTURES.length - 1];
      if (!fixtureSchedule) {
        throw new Error("No content schedule fixtures available");
      }

      const response = await app.handle(
        new Request(`http://localhost/api/content-schedules/${fixtureSchedule.id}`, {
          method: "DELETE",
        })
      );
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);

      const dataSource = getTestDataSource();
      const repository = dataSource.getRepository(ContentSchedule);
      const deletedSchedule = await repository.findOne({ where: { id: fixtureSchedule.id } });
      expect(deletedSchedule).toBeNull();
    });
  });
});

