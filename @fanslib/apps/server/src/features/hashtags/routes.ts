import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { validationError, notFound } from "../../lib/hono-utils";
import { fetchHashtagStats } from "./operations/hashtag-stats/fetch-stats";
import { UpdateHashtagStatsRequestBodySchema, updateHashtagStats } from "./operations/hashtag-stats/update";
import { deleteHashtag } from "./operations/hashtag/delete";
import { fetchAllHashtags } from "./operations/hashtag/fetch-all";
import { fetchHashtagById } from "./operations/hashtag/fetch-by-id";
import { FetchHashtagsByIdsQuerySchema, fetchHashtagsByIds } from "./operations/hashtag/fetch-by-ids";
import { FindOrCreateHashtagRequestBodySchema, FindOrCreateHashtagsByIdsRequestBodySchema, findOrCreateHashtag, findOrCreateHashtags } from "./operations/hashtag/find-or-create";

export const hashtagsRoutes = new Hono()
  .basePath("/api/hashtags")
  .get("/all", async (c) => {
    const result = await fetchAllHashtags();
    return c.json(result);
  })
  .get("/by-ids", zValidator("query", FetchHashtagsByIdsQuerySchema, validationError), async (c) => {
    const query = c.req.valid("query");
    const ids = query.ids ? JSON.parse(query.ids) : [];
    const numberIds = ids.map((id: unknown) => (typeof id === "string" ? parseInt(id, 10) : id));
    const result = await fetchHashtagsByIds(numberIds.filter((id: number) => !isNaN(id)) as number[]);
    return c.json(result);
  })
  .get("/by-id/:id", async (c) => {
    const id = parseInt(c.req.param("id"));
    const hashtag = await fetchHashtagById(id);
    if (!hashtag) {
      return notFound(c, "Hashtag not found");
    }
    return c.json(hashtag);
  })
  .post("/", zValidator("json", FindOrCreateHashtagRequestBodySchema, validationError), async (c) => {
    const body = c.req.valid("json");
    const result = await findOrCreateHashtag(body.name);
    return c.json(result);
  })
  .post("/by-ids", zValidator("json", FindOrCreateHashtagsByIdsRequestBodySchema, validationError), async (c) => {
    const body = c.req.valid("json");
    const result = await findOrCreateHashtags(body.names);
    return c.json(result);
  })
  .delete("/by-id/:id", async (c) => {
    const id = parseInt(c.req.param("id"));
    const success = await deleteHashtag(id);
    if (!success) {
      return notFound(c, "Hashtag not found");
    }
    return c.json({ success: true });
  })
  .get("/by-id/:id/stats", async (c) => {
    const id = parseInt(c.req.param("id"));
    const result = await fetchHashtagStats(id);
    return c.json(result);
  })
  .post("/by-id/:id/stats", zValidator("json", UpdateHashtagStatsRequestBodySchema, validationError), async (c) => {
    const id = parseInt(c.req.param("id"));
    const body = c.req.valid("json");
    const result = await updateHashtagStats(id, body.channelId, body.views);
    return c.json(result);
  });

