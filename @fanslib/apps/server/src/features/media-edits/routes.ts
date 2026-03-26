import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { validationError, notFound } from "../../lib/hono-utils";
import { CreateMediaEditRequestBodySchema, createMediaEdit } from "./operations/media-edit/create";
import { deleteMediaEdit } from "./operations/media-edit/delete";
import { fetchMediaEditById } from "./operations/media-edit/fetch-by-id";
import { fetchMediaEditQueue } from "./operations/media-edit/fetch-queue";
import { fetchMediaEditsBySource } from "./operations/media-edit/fetch-by-source";
import { queueMediaEdit } from "./operations/media-edit/queue";
import { addRenderListener } from "./render-events";
import { UpdateMediaEditRequestBodySchema, updateMediaEdit } from "./operations/media-edit/update";

export const mediaEditsRoutes = new Hono()
  .basePath("/api/media-edits")
  .get("/render-progress", async (c) => {
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    const removeListener = addRenderListener((event) => {
      const data = JSON.stringify(event);
      writer.write(encoder.encode(`event: ${event.type}\ndata: ${data}\n\n`));
    });

    // Clean up when client disconnects
    c.req.raw.signal.addEventListener("abort", () => {
      removeListener();
      writer.close();
    });

    return new Response(readable, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  })
  .get("/queue", async (c) => {
    const queue = await fetchMediaEditQueue();
    return c.json(queue);
  })
  .post("/:id/queue", async (c) => {
    const id = c.req.param("id");
    const result = await queueMediaEdit(id);
    if (result === null) return notFound(c, "MediaEdit not found");
    if (result === "not_draft") return c.json({ error: "Only draft edits can be queued" }, 422);
    return c.json(result);
  })
  .post("/", zValidator("json", CreateMediaEditRequestBodySchema, validationError), async (c) => {
    const body = c.req.valid("json");
    const result = await createMediaEdit(body);
    return c.json(result);
  })
  .get("/by-source/:mediaId", async (c) => {
    const mediaId = c.req.param("mediaId");
    const edits = await fetchMediaEditsBySource(mediaId);
    return c.json(edits);
  })
  .get("/:id", async (c) => {
    const id = c.req.param("id");
    const mediaEdit = await fetchMediaEditById(id);
    if (!mediaEdit) {
      return notFound(c, "MediaEdit not found");
    }
    return c.json(mediaEdit);
  })
  .patch("/:id", zValidator("json", UpdateMediaEditRequestBodySchema, validationError), async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const mediaEdit = await updateMediaEdit(id, body);
    if (!mediaEdit) {
      return notFound(c, "MediaEdit not found");
    }
    return c.json(mediaEdit);
  })
  .delete("/:id", async (c) => {
    const id = c.req.param("id");
    const success = await deleteMediaEdit(id);
    if (!success) {
      return notFound(c, "MediaEdit not found");
    }
    return c.json({ success: true });
  });
