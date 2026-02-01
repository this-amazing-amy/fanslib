import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { validationError, notFound } from "../../lib/hono-utils";
import { CreateContentScheduleRequestBodySchema, createContentSchedule } from "./operations/content-schedule/create";
import { deleteContentSchedule } from "./operations/content-schedule/delete";
import { fetchAllContentSchedules } from "./operations/content-schedule/fetch-all";
import { fetchContentSchedulesByChannel } from "./operations/content-schedule/fetch-by-channel";
import { fetchContentScheduleById } from "./operations/content-schedule/fetch-by-id";
import { UpdateContentScheduleRequestBodySchema, updateContentSchedule } from "./operations/content-schedule/update";
import { FetchVirtualPostsRequestQuerySchema, fetchVirtualPosts } from "./operations/generate-virtual-posts";
import { CreateSkippedSlotRequestBodySchema, createSkippedSlot } from "./operations/skipped-slots/create";
import { removeSkippedSlot } from "./operations/skipped-slots/remove";

export const contentSchedulesRoutes = new Hono()
  .basePath("/api/content-schedules")
  .get("/all", async (c) => {
    const result = await fetchAllContentSchedules();
    return c.json(result);
  })
  .get("/by-channel-id/:channelId", async (c) => {
    const channelId = c.req.param("channelId");
    const result = await fetchContentSchedulesByChannel(channelId);
    return c.json(result);
  })
  .get("/by-id/:id", async (c) => {
    const id = c.req.param("id");
    const schedule = await fetchContentScheduleById(id);
    if (!schedule) {
      return notFound(c, "Content schedule not found");
    }
    return c.json(schedule);
  })
  .get("/virtual-posts", zValidator("query", FetchVirtualPostsRequestQuerySchema, validationError), async (c) => {
    const query = c.req.valid("query");
    const result = await fetchVirtualPosts(query);
    return c.json(result);
  })
  .post("/", zValidator("json", CreateContentScheduleRequestBodySchema, validationError), async (c) => {
    const body = c.req.valid("json");
    const result = await createContentSchedule(body);
    return c.json(result);
  })
  .patch("/by-id/:id", zValidator("json", UpdateContentScheduleRequestBodySchema, validationError), async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const schedule = await updateContentSchedule(id, body);
    if (!schedule) {
      return notFound(c, "Content schedule not found");
    }
    return c.json(schedule);
  })
  .delete("/by-id/:id", async (c) => {
    const id = c.req.param("id");
    const success = await deleteContentSchedule(id);
    if (!success) {
      return notFound(c, "Content schedule not found");
    }
    return c.json({ success: true });
  })
  .post("/skipped-slots", zValidator("json", CreateSkippedSlotRequestBodySchema, validationError), async (c) => {
    const body = c.req.valid("json");
    const result = await createSkippedSlot(body);
    return c.json(result);
  })
  .delete("/skipped-slots/:id", async (c) => {
    const id = c.req.param("id");
    const success = await removeSkippedSlot(id);
    if (!success) {
      return notFound(c, "Skipped slot not found");
    }
    return c.json({ success: true });
  });

