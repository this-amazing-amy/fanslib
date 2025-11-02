import type { CreateSnippetRequest, UpdateSnippetRequest } from "@fanslib/types";
import { Elysia } from "elysia";
import { createSnippet } from "./operations/snippet/create";
import { deleteSnippet } from "./operations/snippet/delete";
import { getAllSnippets } from "./operations/snippet/fetch-all";
import { getSnippetsByChannel } from "./operations/snippet/fetch-by-channel";
import { getSnippetById } from "./operations/snippet/fetch-by-id";
import { getGlobalSnippets } from "./operations/snippet/fetch-global";
import { updateSnippet } from "./operations/snippet/update";

export const snippetsRoutes = new Elysia({ prefix: "/api/snippets" })
  .get("/", async () => getAllSnippets())
  .get("/global", async () => getGlobalSnippets())
  .get("/by-channel/:channelId", async ({ params: { channelId } }) =>
    getSnippetsByChannel(channelId)
  )
  .get("/:id", async ({ params: { id } }) => {
    const snippet = await getSnippetById(id);
    if (!snippet) {
      return { error: "Snippet not found" };
    }
    return snippet;
  })
  .post("/", async ({ body }) => createSnippet(body as CreateSnippetRequest))
  .patch("/:id", async ({ params: { id }, body }) => updateSnippet(id, body as UpdateSnippetRequest))
  .delete("/:id", async ({ params: { id } }) => {
    await deleteSnippet(id);
    return { success: true };
  });

