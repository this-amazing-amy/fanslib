import { Elysia, t } from "elysia";
import { FetchChannelTypesResponseSchema, fetchChannelTypes } from "./operations/channel-type/fetch-all";
import { CreateChannelRequestBodySchema, CreateChannelResponseSchema, createChannel } from "./operations/channel/create";
import { DeleteChannelRequestParamsSchema, DeleteChannelResponseSchema, deleteChannel } from "./operations/channel/delete";
import { FetchAllChannelsResponseSchema, fetchAllChannels } from "./operations/channel/fetch-all";
import { FetchChannelByIdRequestParamsSchema, FetchChannelByIdResponseSchema, fetchChannelById } from "./operations/channel/fetch-by-id";
import { UpdateChannelRequestBodySchema, UpdateChannelRequestParamsSchema, UpdateChannelResponseSchema, updateChannel } from "./operations/channel/update";

export const channelsRoutes = new Elysia({ prefix: "/api/channels" })
  .get("/all", fetchAllChannels, {
    response: FetchAllChannelsResponseSchema,
  })
  .get("/types", fetchChannelTypes, {
    response: FetchChannelTypesResponseSchema,
  })
  .get("/by-id/:id", async ({ params: { id }, set }) => {
    const channel = await fetchChannelById(id);
    if (!channel) {
      set.status = 404;
      return { error: "Channel not found" };
    }
    return channel;
  }, {
    params: FetchChannelByIdRequestParamsSchema,
    response: {
      200: FetchChannelByIdResponseSchema,
      404: t.Object({ error: t.String() }),
    },
  })
  .post("/", async ({ body }) => createChannel(body), {
    body: CreateChannelRequestBodySchema,
    response: CreateChannelResponseSchema,
  })
  .patch("/by-id/:id", async ({ params: { id }, body, set }) => {
    const channel = await updateChannel(id, body);
    if (!channel) {
      set.status = 404;
      return { error: "Channel not found" };
    }
    return channel;
  }, {
    params: UpdateChannelRequestParamsSchema,
    body: UpdateChannelRequestBodySchema,
    response: {
      200: UpdateChannelResponseSchema,
      404: t.Object({ error: t.String() }),
    },
  })
  .delete("/by-id/:id", async ({ params: { id }, set }) => {
    const success = await deleteChannel(id);
    if (!success) {
      set.status = 404;
      return { error: "Channel not found" };
    }
    return { success: true };
  }, {
    params: DeleteChannelRequestParamsSchema,
    response: {
      200: DeleteChannelResponseSchema,
      404: t.Object({ error: t.String() }),
    },
  });

