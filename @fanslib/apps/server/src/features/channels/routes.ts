import { Elysia } from "elysia";
import { FetchChannelTypesResponseSchema, fetchChannelTypes } from "./operations/channel-type/fetch-all";
import { CreateChannelRequestBodySchema, CreateChannelResponseSchema, createChannel } from "./operations/channel/create";
import { DeleteChannelResponseSchema, deleteChannel } from "./operations/channel/delete";
import { FetchAllChannelsResponseSchema, fetchAllChannels } from "./operations/channel/fetch-all";
import { FetchChannelByIdResponseSchema, fetchChannelById } from "./operations/channel/fetch-by-id";
import { UpdateChannelRequestBodySchema, UpdateChannelResponseSchema, updateChannel } from "./operations/channel/update";

export const channelsRoutes = new Elysia({ prefix: "/api/channels" })
  .get("/", fetchAllChannels, {
    response: FetchAllChannelsResponseSchema,
  })
  .get("/types", fetchChannelTypes, {
    response: FetchChannelTypesResponseSchema,
  })
  .get("/:id", async ({ params: { id } }) => {
    const channel = await fetchChannelById(id);
    if (!channel) {
      return { error: "Channel not found" };
    }
    return channel;
  }, {
    response: FetchChannelByIdResponseSchema,
  })
  .post("/", async ({ body }) => createChannel(body), {
    body: CreateChannelRequestBodySchema,
    response: CreateChannelResponseSchema,
  })
  .patch("/:id", async ({ params: { id }, body }) => {
    const channel = await updateChannel(id, body);
    if (!channel) {
      return { error: "Channel not found" };
    }
    return channel;
  }, {
    body: UpdateChannelRequestBodySchema,
    response: UpdateChannelResponseSchema,
  })
  .delete("/:id", async ({ params: { id } }) => {
    await deleteChannel(id);
    return { success: true };
  }, {
    response: DeleteChannelResponseSchema,
  });

