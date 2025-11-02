import type { FetchHashtagsByIdsRequest, FindOrCreateHashtagRequest, FindOrCreateHashtagsBatchRequest, UpdateHashtagStatsRequest } from "@fanslib/types";
import { Elysia } from "elysia";
import { getHashtagStats } from "./operations/hashtag-stats/fetch-stats";
import { updateHashtagStats } from "./operations/hashtag-stats/update";
import { deleteHashtag } from "./operations/hashtag/delete";
import { getAllHashtags } from "./operations/hashtag/fetch-all";
import { getHashtagById } from "./operations/hashtag/fetch-by-id";
import { getHashtagsByIds } from "./operations/hashtag/fetch-by-ids";
import { findOrCreateHashtag, findOrCreateHashtags } from "./operations/hashtag/find-or-create";

export const hashtagsRoutes = new Elysia({ prefix: "/api/hashtags" })
  .get("/", async () => getAllHashtags())
  .get("/:id", async ({ params: { id } }) => {
    const hashtag = await getHashtagById(parseInt(id));
    if (!hashtag) {
      return { error: "Hashtag not found" };
    }
    return hashtag;
  })
  .post("/", async ({ body }) => {
    const request = body as FindOrCreateHashtagRequest;
    return findOrCreateHashtag(request.name);
  })
  .post("/batch", async ({ body }) => {
    const request = body as FindOrCreateHashtagsBatchRequest;
    return findOrCreateHashtags(request.names);
  })
  .delete("/:id", async ({ params: { id } }) => {
    await deleteHashtag(parseInt(id));
    return { success: true };
  })
  .get("/:id/stats", async ({ params: { id } }) => getHashtagStats(parseInt(id)))
  .post("/:id/stats", async ({ params: { id }, body }) => {
    const request = body as UpdateHashtagStatsRequest;
    return updateHashtagStats(parseInt(id), request.channelId, request.views);
  })
  .get("/by-ids", async ({ query }) => {
    const request: FetchHashtagsByIdsRequest = {
      ids: query.ids ? JSON.parse(query.ids as string) : [],
    };
    const ids = request.ids.map((id) => (typeof id === "string" ? parseInt(id, 10) : id));
    return getHashtagsByIds(ids.filter((id) => !isNaN(id)) as number[]);
  });

