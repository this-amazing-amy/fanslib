import { Elysia } from "elysia";
import { GetHashtagStatsRequestParamsSchema, GetHashtagStatsResponseSchema, getHashtagStats } from "./operations/hashtag-stats/fetch-stats";
import { UpdateHashtagStatsRequestBodySchema, UpdateHashtagStatsRequestParamsSchema, UpdateHashtagStatsResponseSchema, updateHashtagStats } from "./operations/hashtag-stats/update";
import { DeleteHashtagRequestParamsSchema, DeleteHashtagResponseSchema, deleteHashtag } from "./operations/hashtag/delete";
import { GetAllHashtagsResponseSchema, getAllHashtags } from "./operations/hashtag/fetch-all";
import { GetHashtagByIdRequestParamsSchema, GetHashtagByIdResponseSchema, getHashtagById } from "./operations/hashtag/fetch-by-id";
import { GetHashtagsByIdsQuerySchema, GetHashtagsByIdsResponseSchema, getHashtagsByIds } from "./operations/hashtag/fetch-by-ids";
import { FindOrCreateHashtagRequestBodySchema, FindOrCreateHashtagResponseSchema, FindOrCreateHashtagsBatchRequestBodySchema, FindOrCreateHashtagsBatchResponseSchema, findOrCreateHashtag, findOrCreateHashtags } from "./operations/hashtag/find-or-create";

export const hashtagsRoutes = new Elysia({ prefix: "/api/hashtags" })
  .get("/", async () => getAllHashtags(), {
    response: GetAllHashtagsResponseSchema,
  })
  .get("/:id", async ({ params: { id } }) => {
    const hashtag = await getHashtagById(parseInt(id));
    if (!hashtag) {
      return { error: "Hashtag not found" };
    }
    return hashtag;
  }, {
    params: GetHashtagByIdRequestParamsSchema,
    response: GetHashtagByIdResponseSchema,
  })
  .post("/", async ({ body }) => findOrCreateHashtag(body.name), {
    body: FindOrCreateHashtagRequestBodySchema,
    response: FindOrCreateHashtagResponseSchema,
  })
  .post("/batch", async ({ body }) => findOrCreateHashtags(body.names), {
    body: FindOrCreateHashtagsBatchRequestBodySchema,
    response: FindOrCreateHashtagsBatchResponseSchema,
  })
  .delete("/:id", async ({ params: { id } }) => deleteHashtag(parseInt(id)), {
    params: DeleteHashtagRequestParamsSchema,
    response: DeleteHashtagResponseSchema,
  })
  .get("/:id/stats", async ({ params: { id } }) => getHashtagStats(parseInt(id)), {
    params: GetHashtagStatsRequestParamsSchema,
    response: GetHashtagStatsResponseSchema,
  })
  .post("/:id/stats", async ({ params: { id }, body }) => updateHashtagStats(parseInt(id), body.channelId, body.views), {
    params: UpdateHashtagStatsRequestParamsSchema,
    body: UpdateHashtagStatsRequestBodySchema,
    response: UpdateHashtagStatsResponseSchema,
  })
  .get("/by-ids", async ({ query }) => {
    const ids = query.ids ? JSON.parse(query.ids as string) : [];
    const numberIds = ids.map((id: unknown) => (typeof id === "string" ? parseInt(id, 10) : id));
    return getHashtagsByIds(numberIds.filter((id: number) => !isNaN(id)) as number[]);
  }, {
    query: GetHashtagsByIdsQuerySchema,
    response: GetHashtagsByIdsResponseSchema,
  });

