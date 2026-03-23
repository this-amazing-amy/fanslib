import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { addDays } from "date-fns";
import { Hono } from "hono";
import "reflect-metadata";
import type { z } from "zod";
import { devalueMiddleware } from "../../lib/devalue-middleware";
import { getTestDataSource, setupTestDatabase, teardownTestDatabase } from "../../lib/test-db";
import { resetAllFixtures } from "../../lib/test-fixtures";
import { parseResponse } from "../../test-utils/setup";
import { ContentSchedule } from "./entity";
import { CONTENT_SCHEDULE_FIXTURES } from "./fixtures-data";
import type { VirtualPostSchema } from "./operations/generate-virtual-posts";
import { contentSchedulesRoutes } from "./routes";

type VirtualPost = z.infer<typeof VirtualPostSchema>;

type ScheduleResponse = ContentSchedule & {
  scheduleChannels: Array<{ channelId: string }>;
};

describe("Content Schedules Routes", () => {
  // eslint-disable-next-line functional/no-let
  let app: Hono;
  // eslint-disable-next-line functional/no-let
  let fixtures: Awaited<ReturnType<typeof resetAllFixtures>>;

  beforeAll(async () => {
    await setupTestDatabase();
    fixtures = await resetAllFixtures();
    app = new Hono().use("*", devalueMiddleware()).route("/", contentSchedulesRoutes);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    fixtures = await resetAllFixtures();
  });

  describe("GET /api/content-schedules/all", () => {
    test("returns all content schedules", async () => {
      const response = await app.request("/api/content-schedules/all");
      expect(response.status).toBe(200);

      const data = await parseResponse<ScheduleResponse[]>(response);
      expect(Array.isArray(data)).toBe(true);
      expect(data?.length).toBeGreaterThanOrEqual(CONTENT_SCHEDULE_FIXTURES.length);

      CONTENT_SCHEDULE_FIXTURES.forEach((fixture) => {
        const schedule = data?.find((s) => s.id === fixture.id);
        expect(schedule).toBeDefined();
        expect(schedule?.type).toBe(fixture.type);
        expect(schedule?.scheduleChannels?.length).toBeGreaterThanOrEqual(1);
        expect(
          schedule?.scheduleChannels?.some((sc) => sc.channelId === fixture.fixtureChannelId),
        ).toBe(true);
      });
    });
  });

  describe("GET /api/content-schedules/by-id/:id", () => {
    test("returns content schedule by id", async () => {
      const fixtureSchedule = CONTENT_SCHEDULE_FIXTURES[0];
      if (!fixtureSchedule) {
        throw new Error("No content schedule fixtures available");
      }

      const response = await app.request(`/api/content-schedules/by-id/${fixtureSchedule.id}`);
      expect(response.status).toBe(200);

      const data = await parseResponse<ScheduleResponse>(response);
      expect(data?.id).toBe(fixtureSchedule.id);
      expect(data?.type).toBe(fixtureSchedule.type);
      expect(data?.scheduleChannels?.length).toBeGreaterThanOrEqual(1);
    });

    test("returns error for non-existent schedule", async () => {
      const response = await app.request("/api/content-schedules/by-id/non-existent-id");

      const data = await parseResponse<{ error: string }>(response);
      expect(data).toHaveProperty("error");
      expect(data?.error).toBe("Content schedule not found");
    });
  });

  describe("GET /api/content-schedules/by-channel-id/:channelId", () => {
    test("returns schedules for specific channel via scheduleChannels", async () => {
      const fixtureChannel = fixtures.channels.channels[0];
      if (!fixtureChannel) {
        throw new Error("No channel fixtures available");
      }

      const response = await app.request(
        `/api/content-schedules/by-channel-id/${fixtureChannel.id}`,
      );
      const data = await parseResponse<ScheduleResponse[]>(response);

      expect(Array.isArray(data)).toBe(true);
      data?.forEach((schedule) => {
        expect(
          schedule.scheduleChannels?.some((sc) => sc.channelId === fixtureChannel.id),
        ).toBe(true);
      });
    });
  });

  describe("POST /api/content-schedules", () => {
    test("creates a schedule with scheduleChannels and fetches it by channel", async () => {
      const channel = fixtures.channels.channels[0];
      if (!channel) {
        throw new Error("No channel fixtures available");
      }

      const scheduleData = {
        name: "Multi-Channel Schedule",
        type: "daily",
        postsPerTimeframe: 2,
        preferredTimes: ["14:30"],
        scheduleChannels: [{ channelId: channel.id }],
      };

      const createResponse = await app.request("/api/content-schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduleData),
      });
      expect(createResponse.status).toBe(200);

      const created = await parseResponse<ScheduleResponse>(createResponse);
      expect(created?.type).toBe("daily");
      expect(created?.scheduleChannels).toBeDefined();
      expect(created?.scheduleChannels?.length).toBe(1);
      expect(created?.scheduleChannels?.[0]?.channelId).toBe(channel.id);

      // Verify it appears when fetching by channel
      const fetchResponse = await app.request(
        `/api/content-schedules/by-channel-id/${channel.id}`,
      );
      const fetched = await parseResponse<ScheduleResponse[]>(fetchResponse);
      const match = fetched?.find((s) => s.id === created?.id);
      expect(match).toBeDefined();
      expect(match?.scheduleChannels?.some((sc) => sc.channelId === channel.id)).toBe(true);
    });
  });

  describe("PATCH /api/content-schedules/by-id/:id", () => {
    test("updates content schedule", async () => {
      const fixtureSchedule = CONTENT_SCHEDULE_FIXTURES[0];
      if (!fixtureSchedule) {
        throw new Error("No content schedule fixtures available");
      }

      const updateData = {
        preferredTimes: ["16:00"],
      };

      const response = await app.request(`/api/content-schedules/by-id/${fixtureSchedule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      expect(response.status).toBe(200);

      const data = await parseResponse<ScheduleResponse>(response);
      expect(Array.isArray(data?.preferredTimes)).toBe(true);
      expect(data?.id).toBe(fixtureSchedule.id);
    });

    test("returns error for non-existent schedule", async () => {
      const response = await app.request("/api/content-schedules/by-id/non-existent-id", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ time: "12:00" }),
      });

      const data = await parseResponse<{ error: string }>(response);
      expect(data).toHaveProperty("error");
      expect(data?.error).toBe("Content schedule not found");
    });
  });

  describe("DELETE /api/content-schedules/by-id/:id", () => {
    test("deletes content schedule", async () => {
      const fixtureSchedule = CONTENT_SCHEDULE_FIXTURES[CONTENT_SCHEDULE_FIXTURES.length - 1];
      if (!fixtureSchedule) {
        throw new Error("No content schedule fixtures available");
      }

      const response = await app.request(`/api/content-schedules/by-id/${fixtureSchedule.id}`, {
        method: "DELETE",
      });
      expect(response.status).toBe(200);

      const data = await parseResponse<{ success: boolean }>(response);
      expect(data?.success).toBe(true);

      const dataSource = getTestDataSource();
      const repository = dataSource.getRepository(ContentSchedule);
      const deletedSchedule = await repository.findOne({ where: { id: fixtureSchedule.id } });
      expect(deletedSchedule).toBeNull();
    });

    test("returns 404 when content schedule not found", async () => {
      const response = await app.request("/api/content-schedules/by-id/non-existent-id", {
        method: "DELETE",
      });
      expect(response.status).toBe(404);

      const data = await parseResponse<{ error: string }>(response);
      expect(data?.error).toBe("Content schedule not found");
    });
  });

  describe("POST /api/content-schedules/:id/link-channel", () => {
    test("links a channel to a schedule and returns updated schedule", async () => {
      const fixtureSchedule = CONTENT_SCHEDULE_FIXTURES[0];
      if (!fixtureSchedule) {
        throw new Error("No content schedule fixtures available");
      }

      // Use a channel that is NOT already linked to this schedule
      const unlinkedChannel = fixtures.channels.channels.find(
        (c) => c.id !== fixtureSchedule.fixtureChannelId,
      );
      if (!unlinkedChannel) {
        throw new Error("No unlinked channel available");
      }

      const response = await app.request(
        `/api/content-schedules/${fixtureSchedule.id}/link-channel`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channelId: unlinkedChannel.id }),
        },
      );
      expect(response.status).toBe(200);

      const data = await parseResponse<ScheduleResponse>(response);
      expect(data?.id).toBe(fixtureSchedule.id);
      expect(data?.scheduleChannels?.some((sc) => sc.channelId === unlinkedChannel.id)).toBe(true);
    });

    test("returns 409 when channel is already linked", async () => {
      const fixtureSchedule = CONTENT_SCHEDULE_FIXTURES[0];
      if (!fixtureSchedule) {
        throw new Error("No content schedule fixtures available");
      }

      // The fixture channel is already linked via seed data
      const response = await app.request(
        `/api/content-schedules/${fixtureSchedule.id}/link-channel`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channelId: fixtureSchedule.fixtureChannelId }),
        },
      );
      expect(response.status).toBe(409);

      const data = await parseResponse<{ error: string }>(response);
      expect(data?.error).toBe("Channel already linked to this schedule");
    });
  });

  describe("DELETE /api/content-schedules/:id/unlink-channel/:channelId", () => {
    test("unlinks a channel from a schedule and returns updated schedule", async () => {
      const fixtureSchedule = CONTENT_SCHEDULE_FIXTURES[0];
      if (!fixtureSchedule) {
        throw new Error("No content schedule fixtures available");
      }

      // First link a new channel so we can unlink it
      const unlinkedChannel = fixtures.channels.channels.find(
        (c) => c.id !== fixtureSchedule.fixtureChannelId,
      );
      if (!unlinkedChannel) {
        throw new Error("No unlinked channel available");
      }

      await app.request(`/api/content-schedules/${fixtureSchedule.id}/link-channel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId: unlinkedChannel.id }),
      });

      const response = await app.request(
        `/api/content-schedules/${fixtureSchedule.id}/unlink-channel/${unlinkedChannel.id}`,
        { method: "DELETE" },
      );
      expect(response.status).toBe(200);

      const data = await parseResponse<ScheduleResponse>(response);
      expect(data?.id).toBe(fixtureSchedule.id);
      expect(data?.scheduleChannels?.some((sc) => sc.channelId === unlinkedChannel.id)).toBe(false);
    });

    test("returns 404 when channel is not linked", async () => {
      const fixtureSchedule = CONTENT_SCHEDULE_FIXTURES[0];
      if (!fixtureSchedule) {
        throw new Error("No content schedule fixtures available");
      }

      const response = await app.request(
        `/api/content-schedules/${fixtureSchedule.id}/unlink-channel/non-existent-channel`,
        { method: "DELETE" },
      );
      expect(response.status).toBe(404);

      const data = await parseResponse<{ error: string }>(response);
      expect(data?.error).toBe("Channel is not linked to this schedule");
    });
  });

  describe("GET /api/content-schedules/virtual-posts", () => {
    test("returns virtual posts for channel ids as comma-separated string", async () => {
      const channel = fixtures.channels.channels[0];
      if (!channel) {
        throw new Error("No channel fixtures available");
      }

      const fromDate = new Date().toISOString();
      const toDate = addDays(new Date(), 30).toISOString();

      const response = await app.request(
        `/api/content-schedules/virtual-posts?channelIds=${channel.id}&fromDate=${fromDate}&toDate=${toDate}`,
      );
      expect(response.status).toBe(200);

      const data = await parseResponse<VirtualPost[]>(response);
      expect(Array.isArray(data)).toBe(true);
    });

    test("returns virtual posts for multiple channel ids as comma-separated string", async () => {
      const channels = fixtures.channels.channels.slice(0, 2);
      if (channels.length < 2) {
        throw new Error("Not enough channel fixtures available");
      }

      const channelIds = channels.map((c) => c.id).join(",");
      const fromDate = new Date().toISOString();
      const toDate = addDays(new Date(), 30).toISOString();

      const response = await app.request(
        `/api/content-schedules/virtual-posts?channelIds=${channelIds}&fromDate=${fromDate}&toDate=${toDate}`,
      );
      expect(response.status).toBe(200);

      const data = await parseResponse<VirtualPost[]>(response);
      expect(Array.isArray(data)).toBe(true);
    });

    test("returns 422 when channelIds is missing", async () => {
      const fromDate = new Date().toISOString();
      const toDate = addDays(new Date(), 30).toISOString();

      const response = await app.request(
        `/api/content-schedules/virtual-posts?fromDate=${fromDate}&toDate=${toDate}`,
      );
      expect(response.status).toBe(422);

      const data = await parseResponse<{ error: string }>(response);
      expect(data?.error).toBe("Validation failed");
    });
  });
});
