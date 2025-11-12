import { Elysia, t } from "elysia";
import { CreateSnippetRequestBodySchema, CreateSnippetResponseSchema, createSnippet } from "./operations/snippet/create";
import { DeleteSnippetRequestParamsSchema, DeleteSnippetResponseSchema, deleteSnippet } from "./operations/snippet/delete";
import { FetchAllSnippetsResponseSchema, fetchAllSnippets } from "./operations/snippet/fetch-all";
import { FetchSnippetsByChannelRequestParamsSchema, FetchSnippetsByChannelResponseSchema, fetchSnippetsByChannel } from "./operations/snippet/fetch-by-channel";
import { FetchSnippetByIdRequestParamsSchema, FetchSnippetByIdResponseSchema, fetchSnippetById } from "./operations/snippet/fetch-by-id";
import { FetchGlobalSnippetsResponseSchema, fetchGlobalSnippets } from "./operations/snippet/fetch-global";
import { UpdateSnippetRequestBodySchema, UpdateSnippetRequestParamsSchema, UpdateSnippetResponseSchema, updateSnippet } from "./operations/snippet/update";

export const snippetsRoutes = new Elysia({ prefix: "/api/snippets" })
  .get("/all", fetchAllSnippets, {
    response: FetchAllSnippetsResponseSchema,
  })
  .get("/global", fetchGlobalSnippets, {
    response: FetchGlobalSnippetsResponseSchema,
  })
  .get("/by-channel-id/:channelId", async ({ params: { channelId } }) =>
    fetchSnippetsByChannel(channelId), {
    params: FetchSnippetsByChannelRequestParamsSchema,
    response: FetchSnippetsByChannelResponseSchema,
  })
  .get("/by-id/:id", async ({ params: { id }, set }) => {
    const snippet = await fetchSnippetById(id);
    if (!snippet) {
      set.status = 404;
      return { error: "Snippet not found" };
    }
    return snippet;
  }, {
    params: FetchSnippetByIdRequestParamsSchema,
    response: {
      200: FetchSnippetByIdResponseSchema,
      404: t.Object({ error: t.String() }),
    },
  })
  .post("/", async ({ body }) => createSnippet(body), {
    body: CreateSnippetRequestBodySchema,
    response: CreateSnippetResponseSchema,
  })
  .patch("/by-id/:id", async ({ params: { id }, body, set }) => {
    const snippet = await updateSnippet(id, body);
    if (!snippet) {
      set.status = 404;
      return { error: "Snippet not found" };
    }
    return snippet;
  }, {
    params: UpdateSnippetRequestParamsSchema,
    body: UpdateSnippetRequestBodySchema,
    response: {
      200: UpdateSnippetResponseSchema,
      404: t.Object({ error: t.String() }),
    },
  })
  .delete("/by-id/:id", async ({ params: { id }, set }) => {
    const success = await deleteSnippet(id);
    if (!success) {
      set.status = 404;
      return { error: "Snippet not found" };
    }
    return { success: true };
  }, {
    params: DeleteSnippetRequestParamsSchema,
    response: {
      200: DeleteSnippetResponseSchema,
      404: t.Object({ error: t.String() }),
    },
  });
