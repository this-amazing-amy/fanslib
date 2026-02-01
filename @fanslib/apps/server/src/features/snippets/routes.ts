import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { validationError, notFound } from "../../lib/hono-utils";
import { CreateSnippetRequestBodySchema, createSnippet } from "./operations/snippet/create";
import { deleteSnippet } from "./operations/snippet/delete";
import { fetchAllSnippets } from "./operations/snippet/fetch-all";
import { fetchSnippetsByChannel } from "./operations/snippet/fetch-by-channel";
import { fetchSnippetById } from "./operations/snippet/fetch-by-id";
import { fetchGlobalSnippets } from "./operations/snippet/fetch-global";
import { UpdateSnippetRequestBodySchema, updateSnippet } from "./operations/snippet/update";

export const snippetsRoutes = new Hono()
  .basePath("/api/snippets")
  .get("/all", async (c) => {
    const result = await fetchAllSnippets();
    return c.json(result);
  })
  .get("/global", async (c) => {
    const result = await fetchGlobalSnippets();
    return c.json(result);
  })
  .get("/by-channel-id/:channelId", async (c) => {
    const channelId = c.req.param("channelId");
    const result = await fetchSnippetsByChannel(channelId);
    return c.json(result);
  })
  .get("/by-id/:id", async (c) => {
    const id = c.req.param("id");
    const snippet = await fetchSnippetById(id);
    if (!snippet) {
      return notFound(c, "Snippet not found");
    }
    return c.json(snippet);
  })
  .post("/", zValidator("json", CreateSnippetRequestBodySchema, validationError), async (c) => {
    const body = c.req.valid("json");
    const result = await createSnippet(body);
    return c.json(result);
  })
  .patch("/by-id/:id", zValidator("json", UpdateSnippetRequestBodySchema, validationError), async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const snippet = await updateSnippet(id, body);
    if (!snippet) {
      return notFound(c, "Snippet not found");
    }
    return c.json(snippet);
  })
  .delete("/by-id/:id", async (c) => {
    const id = c.req.param("id");
    const success = await deleteSnippet(id);
    if (!success) {
      return notFound(c, "Snippet not found");
    }
    return c.json({ success: true });
  });
