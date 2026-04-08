import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { validationError, notFound } from "../../lib/hono-utils";
import {
  CreateCompositionRequestBodySchema,
  createComposition,
} from "./operations/composition/create";
import { deleteComposition } from "./operations/composition/delete";
import { fetchCompositionById } from "./operations/composition/fetch-by-id";
import { fetchCompositionsByShoot } from "./operations/composition/fetch-by-shoot";
import {
  UpdateCompositionRequestBodySchema,
  updateComposition,
} from "./operations/composition/update";

export const compositionsRoutes = new Hono()
  .basePath("/api/compositions")
  .post(
    "/",
    zValidator("json", CreateCompositionRequestBodySchema, validationError),
    async (c) => {
      const body = c.req.valid("json");
      const result = await createComposition(body);
      return c.json(result);
    },
  )
  .patch(
    "/by-id/:id",
    zValidator("json", UpdateCompositionRequestBodySchema, validationError),
    async (c) => {
      const id = c.req.param("id");
      const body = c.req.valid("json");
      const composition = await updateComposition(id, body);
      if (!composition) return notFound(c, "Composition not found");
      return c.json(composition);
    },
  )
  .get("/by-id/:id", async (c) => {
    const id = c.req.param("id");
    const composition = await fetchCompositionById(id);
    if (!composition) return notFound(c, "Composition not found");
    return c.json(composition);
  })
  .get("/by-shoot/:shootId", async (c) => {
    const shootId = c.req.param("shootId");
    const compositions = await fetchCompositionsByShoot(shootId);
    return c.json(compositions);
  })
  .delete("/by-id/:id", async (c) => {
    const id = c.req.param("id");
    const success = await deleteComposition(id);
    if (!success) return notFound(c, "Composition not found");
    return c.json({ success: true });
  });
