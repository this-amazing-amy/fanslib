import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { validationError, notFound } from "../../lib/hono-utils";
import { CreateShootRequestBodySchema, createShoot } from "./operations/shoot/create";
import { deleteShoot } from "./operations/shoot/delete";
import { FetchAllShootsRequestBodySchema, listShoots } from "./operations/shoot/fetch-all";
import { fetchShootById } from "./operations/shoot/fetch-by-id";
import { fetchPostsByShootId } from "./operations/shoot/fetch-posts-by-shoot-id";
import { UpdateShootRequestBodySchema, updateShoot } from "./operations/shoot/update";

export const shootsRoutes = new Hono()
  .basePath("/api/shoots")
  .post("/all", zValidator("json", FetchAllShootsRequestBodySchema, validationError), async (c) => {
    const body = c.req.valid("json");
    const result = await listShoots(body);
    return c.json(result);
  })
  .get("/by-id/:id", async (c) => {
    const id = c.req.param("id");
    const shoot = await fetchShootById(id);
    if (!shoot) {
      return notFound(c, "Shoot not found");
    }
    return c.json(shoot);
  })
  .post("/", zValidator("json", CreateShootRequestBodySchema, validationError), async (c) => {
    const body = c.req.valid("json");
    const result = await createShoot(body);
    return c.json(result);
  })
  .patch("/by-id/:id", zValidator("json", UpdateShootRequestBodySchema, validationError), async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const shoot = await updateShoot(id, body);
    if (!shoot) {
      return notFound(c, "Shoot not found");
    }
    return c.json(shoot);
  })
  .delete("/by-id/:id", async (c) => {
    const id = c.req.param("id");
    const success = await deleteShoot(id);
    if (!success) {
      return notFound(c, "Shoot not found");
    }
    return c.json({ success: true });
  })
  .get("/by-id/:id/posts", async (c) => {
    const id = c.req.param("id");
    const result = await fetchPostsByShootId(id);
    return c.json(result);
  });

