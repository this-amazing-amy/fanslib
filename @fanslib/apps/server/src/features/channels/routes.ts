import type { CreateChannelRequest, UpdateChannelRequest } from "@fanslib/types";
import { Elysia } from "elysia";
import { fetchChannelTypes } from "./operations/channel-type/fetch-all";
import { createChannel } from "./operations/channel/create";
import { deleteChannel } from "./operations/channel/delete";
import { fetchAllChannels } from "./operations/channel/fetch-all";
import { fetchChannelById } from "./operations/channel/fetch-by-id";
import { updateChannel } from "./operations/channel/update";

export const channelsRoutes = new Elysia({ prefix: "/api/channels" })
  .get("/", fetchAllChannels)
  .get("/types", fetchChannelTypes)
  .get("/:id", async ({ params: { id } }) => {
    const channel = await fetchChannelById(id);
    if (!channel) {
      return { error: "Channel not found" };
    }
    return channel;
  })
  .post("/", async ({ body }) => createChannel(body as CreateChannelRequest))
  .patch("/:id", async ({ params: { id }, body }) => {
    const channel = await updateChannel(id, body as UpdateChannelRequest);
    if (!channel) {
      return { error: "Channel not found" };
    }
    return channel;
  })
  .delete("/:id", async ({ params: { id } }) => {
    await deleteChannel(id);
    return { success: true };
  });

