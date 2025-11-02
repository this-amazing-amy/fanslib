import type { CreateContentScheduleRequest, UpdateContentScheduleRequest } from "@fanslib/types";
import { Elysia } from "elysia";
import { createContentSchedule } from "./operations/content-schedule/create";
import { deleteContentSchedule } from "./operations/content-schedule/delete";
import { fetchAllContentSchedules } from "./operations/content-schedule/fetch-all";
import { fetchContentScheduleById } from "./operations/content-schedule/fetch-by-id";
import { fetchContentSchedulesByChannel } from "./operations/content-schedule/fetch-by-channel";
import { updateContentSchedule } from "./operations/content-schedule/update";

export const contentSchedulesRoutes = new Elysia({ prefix: "/api/content-schedules" })
  .get("/", async () => fetchAllContentSchedules())
  .get("/:id", async ({ params: { id } }) => {
    const schedule = await fetchContentScheduleById(id);
    if (!schedule) {
      return { error: "Content schedule not found" };
    }
    return schedule;
  })
  .get("/by-channel/:channelId", async ({ params: { channelId } }) =>
    fetchContentSchedulesByChannel(channelId)
  )
  .post("/", async ({ body }) => createContentSchedule(body as CreateContentScheduleRequest))
  .patch("/:id", async ({ params: { id }, body }) => {
    const schedule = await updateContentSchedule(id, body as UpdateContentScheduleRequest);
    if (!schedule) {
      return { error: "Content schedule not found" };
    }
    return schedule;
  })
  .delete("/:id", async ({ params: { id } }) => {
    await deleteContentSchedule(id);
    return { success: true };
  });

