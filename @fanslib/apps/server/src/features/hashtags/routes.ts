import { Elysia, t } from "elysia";
import { FetchHashtagStatsRequestParamsSchema, FetchHashtagStatsResponseSchema, fetchHashtagStats } from "./operations/hashtag-stats/fetch-stats";
import { UpdateHashtagStatsRequestBodySchema, UpdateHashtagStatsRequestParamsSchema, UpdateHashtagStatsResponseSchema, updateHashtagStats } from "./operations/hashtag-stats/update";
import { DeleteHashtagRequestParamsSchema, DeleteHashtagResponseSchema, deleteHashtag } from "./operations/hashtag/delete";
import { FetchAllHashtagsResponseSchema, fetchAllHashtags } from "./operations/hashtag/fetch-all";
import { FetchHashtagByIdRequestParamsSchema, FetchHashtagByIdResponseSchema, fetchHashtagById } from "./operations/hashtag/fetch-by-id";
import { FetchHashtagsByIdsQuerySchema, FetchHashtagsByIdsResponseSchema, fetchHashtagsByIds } from "./operations/hashtag/fetch-by-ids";
import { FindOrCreateHashtagRequestBodySchema, FindOrCreateHashtagResponseSchema, FindOrCreateHashtagsByIdsRequestBodySchema, FindOrCreateHashtagsByIdsResponseSchema, findOrCreateHashtag, findOrCreateHashtags } from "./operations/hashtag/find-or-create";

export const hashtagsRoutes = new Elysia({ prefix: "/api/hashtags" })
  .get("/all", async () => fetchAllHashtags(), {
    response: FetchAllHashtagsResponseSchema,
  })
  .get("/by-ids", async ({ query }) => {
    const ids = query.ids ? JSON.parse(query.ids as string) : [];
    const numberIds = ids.map((id: unknown) => (typeof id === "string" ? parseInt(id, 10) : id));
    return fetchHashtagsByIds(numberIds.filter((id: number) => !isNaN(id)) as number[]);
  }, {
    query: FetchHashtagsByIdsQuerySchema,
    response: FetchHashtagsByIdsResponseSchema,
  })
  .get("/by-id/:id", async ({ params: { id }, set }) => {
    const hashtag = await fetchHashtagById(parseInt(id));
    if (!hashtag) {
      set.status = 404;
      return { error: "Hashtag not found" };
    }
    return hashtag;
  }, {
    params: FetchHashtagByIdRequestParamsSchema,
    response: {
      200: FetchHashtagByIdResponseSchema,
      404: t.Object({ error: t.String() }),
    },
  })
  .post("/", async ({ body }) => findOrCreateHashtag(body.name), {
    body: FindOrCreateHashtagRequestBodySchema,
    response: FindOrCreateHashtagResponseSchema,
  })
  .post("/by-ids", async ({ body }) => findOrCreateHashtags(body.names), {
    body: FindOrCreateHashtagsByIdsRequestBodySchema,
    response: FindOrCreateHashtagsByIdsResponseSchema,
  })
  .delete("/by-id/:id", async ({ params: { id }, set }) => {
    const success = await deleteHashtag(parseInt(id));
    if (!success) {
      set.status = 404;
      return { error: "Hashtag not found" };
    }
    return { success: true };
  }, {
    params: DeleteHashtagRequestParamsSchema,
    response: {
      200: DeleteHashtagResponseSchema,
      404: t.Object({ error: t.String() }),
    },
  })
  .get("/by-id/:id/stats", async ({ params: { id } }) => fetchHashtagStats(parseInt(id)), {
    params: FetchHashtagStatsRequestParamsSchema,
    response: FetchHashtagStatsResponseSchema,
  })
  .post("/by-id/:id/stats", async ({ params: { id }, body }) => updateHashtagStats(parseInt(id), body.channelId, body.views), {
    params: UpdateHashtagStatsRequestParamsSchema,
    body: UpdateHashtagStatsRequestBodySchema,
    response: UpdateHashtagStatsResponseSchema,
  });

