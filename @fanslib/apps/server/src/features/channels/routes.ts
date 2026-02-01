import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { validationError, notFound } from "../../lib/hono-utils";
import { fetchChannelTypes } from "./operations/channel-type/fetch-all";
import { CreateChannelRequestBodySchema, createChannel } from "./operations/channel/create";
import { deleteChannel } from "./operations/channel/delete";
import { fetchAllChannels } from "./operations/channel/fetch-all";
import { fetchChannelById } from "./operations/channel/fetch-by-id";
import { UpdateChannelRequestBodySchema, updateChannel } from "./operations/channel/update";

export const channelsRoutes = new Hono()
  .basePath("/api/channels")
  .get("/all", async (c) => {
    const result = await fetchAllChannels();
    return c.json(result);
  })
  .get("/types", async (c) => {
    const result = await fetchChannelTypes();
    return c.json(result);
  })
  .get("/by-id/:id", async (c) => {
    const id = c.req.param("id");
    const channel = await fetchChannelById(id);
    if (!channel) {
      return notFound(c, "Channel not found");
    }
    return c.json(channel);
  })
  .post("/", zValidator("json", CreateChannelRequestBodySchema, validationError), async (c) => {
    const body = c.req.valid("json");
    const result = await createChannel(body);
    return c.json(result);
  })
  .patch("/by-id/:id", zValidator("json", UpdateChannelRequestBodySchema, validationError), async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const channel = await updateChannel(id, body);
    if (!channel) {
      return notFound(c, "Channel not found");
    }
    return c.json(channel);
  })
  .delete("/by-id/:id", async (c) => {
    const id = c.req.param("id");
    const success = await deleteChannel(id);
    if (!success) {
      return notFound(c, "Channel not found");
    }
    return c.json({ success: true });
  });

