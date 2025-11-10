import { Elysia } from "elysia";
import { CreateContentScheduleRequestBodySchema, CreateContentScheduleResponseSchema, createContentSchedule } from "./operations/content-schedule/create";
import { DeleteContentScheduleResponseSchema, deleteContentSchedule } from "./operations/content-schedule/delete";
import { FetchAllContentSchedulesResponseSchema, fetchAllContentSchedules } from "./operations/content-schedule/fetch-all";
import { FetchContentSchedulesByChannelResponseSchema, fetchContentSchedulesByChannel } from "./operations/content-schedule/fetch-by-channel";
import { FetchContentScheduleByIdResponseSchema, fetchContentScheduleById } from "./operations/content-schedule/fetch-by-id";
import { UpdateContentScheduleRequestBodySchema, UpdateContentScheduleResponseSchema, updateContentSchedule } from "./operations/content-schedule/update";

export const contentSchedulesRoutes = new Elysia({ prefix: "/api/content-schedules" })
  .get("/", async () => fetchAllContentSchedules(), {
    response: FetchAllContentSchedulesResponseSchema,
  })
  .get("/:id", async ({ params: { id } }) => {
    const schedule = await fetchContentScheduleById(id);
    if (!schedule) {
      return { error: "Content schedule not found" };
    }
    return schedule;
  }, {
    response: FetchContentScheduleByIdResponseSchema,
  })
  .get("/by-channel/:channelId", async ({ params: { channelId } }) =>
    fetchContentSchedulesByChannel(channelId), {
    response: FetchContentSchedulesByChannelResponseSchema,
  })
  .post("/", async ({ body }) => createContentSchedule(body), {
    body: CreateContentScheduleRequestBodySchema,
    response: CreateContentScheduleResponseSchema,
  })
  .patch("/:id", async ({ params: { id }, body }) => {
    const schedule = await updateContentSchedule(id, body);
    if (!schedule) {
      return { error: "Content schedule not found" };
    }
    return schedule;
  }, {
    body: UpdateContentScheduleRequestBodySchema,
    response: UpdateContentScheduleResponseSchema,
  })
  .delete("/:id", async ({ params: { id } }) => {
    await deleteContentSchedule(id);
    return { success: true };
  }, {
    response: DeleteContentScheduleResponseSchema,
  });

