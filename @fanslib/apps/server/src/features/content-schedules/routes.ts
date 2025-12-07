import { Elysia, t } from "elysia";
import { CreateContentScheduleRequestBodySchema, CreateContentScheduleResponseSchema, createContentSchedule } from "./operations/content-schedule/create";
import { DeleteContentScheduleRequestParamsSchema, DeleteContentScheduleResponseSchema, deleteContentSchedule } from "./operations/content-schedule/delete";
import { FetchAllContentSchedulesResponseSchema, fetchAllContentSchedules } from "./operations/content-schedule/fetch-all";
import { FetchContentSchedulesByChannelResponseSchema, fetchContentSchedulesByChannel } from "./operations/content-schedule/fetch-by-channel";
import { FetchContentScheduleByIdRequestParamsSchema, FetchContentScheduleByIdResponseSchema, fetchContentScheduleById } from "./operations/content-schedule/fetch-by-id";
import { UpdateContentScheduleRequestBodySchema, UpdateContentScheduleRequestParamsSchema, UpdateContentScheduleResponseSchema, updateContentSchedule } from "./operations/content-schedule/update";
import { CreateSkippedSlotRequestBodySchema, CreateSkippedSlotResponseSchema, createSkippedSlot } from "./operations/skipped-slots/create";
import { RemoveSkippedSlotRequestParamsSchema, RemoveSkippedSlotResponseSchema, removeSkippedSlot } from "./operations/skipped-slots/remove";

export const contentSchedulesRoutes = new Elysia({ prefix: "/api/content-schedules" })
  .get("/all", async () => fetchAllContentSchedules(), {
    response: FetchAllContentSchedulesResponseSchema,
  })
  .get("/by-channel-id/:channelId", async ({ params: { channelId } }) =>
    fetchContentSchedulesByChannel(channelId), {
    response: FetchContentSchedulesByChannelResponseSchema,
  })
  .get("/by-id/:id", async ({ params: { id }, set }) => {
    const schedule = await fetchContentScheduleById(id);
    if (!schedule) {
      set.status = 404;
      return { error: "Content schedule not found" };
    }
    return schedule;
  }, {
    params: FetchContentScheduleByIdRequestParamsSchema,
    response: {
      200: FetchContentScheduleByIdResponseSchema,
      404: t.Object({ error: t.String() }),
    },
  })
  .post("/", async ({ body }) => createContentSchedule(body), {
    body: CreateContentScheduleRequestBodySchema,
    response: CreateContentScheduleResponseSchema,
  })
  .patch("/by-id/:id", async ({ params: { id }, body, set }) => {
    const schedule = await updateContentSchedule(id, body);
    if (!schedule) {
      set.status = 404;
      return { error: "Content schedule not found" };
    }
    return schedule;
  }, {
    params: UpdateContentScheduleRequestParamsSchema,
    body: UpdateContentScheduleRequestBodySchema,
    response: {
      200: UpdateContentScheduleResponseSchema,
      404: t.Object({ error: t.String() }),
    },
  })
  .delete("/by-id/:id", async ({ params: { id }, set }) => {
    const success = await deleteContentSchedule(id);
    if (!success) {
      set.status = 404;
      return { error: "Content schedule not found" };
    }
    return { success: true };
  }, {
    params: DeleteContentScheduleRequestParamsSchema,
    response: {
      200: DeleteContentScheduleResponseSchema,
      404: t.Object({ error: t.String() }),
    },
  })
  .post("/skipped-slots", async ({ body }) => createSkippedSlot(body), {
    body: CreateSkippedSlotRequestBodySchema,
    response: CreateSkippedSlotResponseSchema,
  })
  .delete("/skipped-slots/:id", async ({ params: { id }, set }) => {
    const success = await removeSkippedSlot(id);
    if (!success) {
      set.status = 404;
      return { error: "Skipped slot not found" };
    }
    return { success: true };
  }, {
    params: RemoveSkippedSlotRequestParamsSchema,
    response: {
      200: RemoveSkippedSlotResponseSchema,
      404: t.Object({ error: t.String() }),
    },
  });

