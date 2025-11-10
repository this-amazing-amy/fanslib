import { Elysia } from "elysia";
import { CreateSnippetRequestBodySchema, CreateSnippetResponseSchema, createSnippet } from "./operations/snippet/create";
import { DeleteSnippetRequestParamsSchema, DeleteSnippetResponseSchema, deleteSnippet } from "./operations/snippet/delete";
import { FetchAllSnippetsResponseSchema, fetchAllSnippets } from "./operations/snippet/fetch-all";
import { FetchSnippetsByChannelRequestParamsSchema, FetchSnippetsByChannelResponseSchema, fetchSnippetsByChannel } from "./operations/snippet/fetch-by-channel";
import { FetchSnippetByIdRequestParamsSchema, FetchSnippetByIdResponseSchema, fetchSnippetById } from "./operations/snippet/fetch-by-id";
import { FetchGlobalSnippetsResponseSchema, fetchGlobalSnippets } from "./operations/snippet/fetch-global";
import { UpdateSnippetRequestBodySchema, UpdateSnippetRequestParamsSchema, UpdateSnippetResponseSchema, updateSnippet } from "./operations/snippet/update";

export const snippetsRoutes = new Elysia({ prefix: "/api/snippets" })
  .get("/", async () => fetchAllSnippets(), {
    response: FetchAllSnippetsResponseSchema,
  })
  .get("/global", async () => fetchGlobalSnippets(), {
    response: FetchGlobalSnippetsResponseSchema,
  })
  .get("/by-channel/:channelId", async ({ params }) =>
    fetchSnippetsByChannel(params), {
    params: FetchSnippetsByChannelRequestParamsSchema,
    response: FetchSnippetsByChannelResponseSchema,
  })
  .get("/:id", async ({ params }) => fetchSnippetById(params), {
    params: FetchSnippetByIdRequestParamsSchema,
    response: FetchSnippetByIdResponseSchema,
  })
  .post("/", async ({ body }) => createSnippet(body), {
    body: CreateSnippetRequestBodySchema,
    response: CreateSnippetResponseSchema,
  })
  .patch("/:id", async ({ params, body }) => updateSnippet(params, body), {
    params: UpdateSnippetRequestParamsSchema,
    body: UpdateSnippetRequestBodySchema,
    response: UpdateSnippetResponseSchema,
  })
  .delete("/:id", async ({ params }) => deleteSnippet(params), {
    params: DeleteSnippetRequestParamsSchema,
    response: DeleteSnippetResponseSchema,
  });
