import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { validationError, notFound } from "../../lib/hono-utils";
import { CreateMediaEditRequestBodySchema, createMediaEdit } from "./operations/media-edit/create";
import { deleteMediaEdit } from "./operations/media-edit/delete";
import { fetchMediaEditById } from "./operations/media-edit/fetch-by-id";
import { fetchMediaEditsBySource } from "./operations/media-edit/fetch-by-source";
import { UpdateMediaEditRequestBodySchema, updateMediaEdit } from "./operations/media-edit/update";

export const mediaEditsRoutes = new Hono()
  .basePath("/api/media-edits")
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
