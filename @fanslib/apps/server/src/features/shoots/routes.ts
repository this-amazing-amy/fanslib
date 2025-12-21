import { Elysia, t } from "elysia";
import { CreateShootRequestBodySchema, CreateShootResponseSchema, createShoot } from "./operations/shoot/create";
import { DeleteShootRequestParamsSchema, DeleteShootResponseSchema, deleteShoot } from "./operations/shoot/delete";
import { FetchAllShootsRequestBodySchema, FetchAllShootsResponseSchema, listShoots } from "./operations/shoot/fetch-all";
import { FetchShootByIdRequestParamsSchema, FetchShootByIdResponseSchema, fetchShootById } from "./operations/shoot/fetch-by-id";
import { FetchPostsByShootIdResponseSchema, fetchPostsByShootId } from "./operations/shoot/fetch-posts-by-shoot-id";
import { UpdateShootRequestBodySchema, UpdateShootRequestParamsSchema, UpdateShootResponseSchema, updateShoot } from "./operations/shoot/update";

export const shootsRoutes = new Elysia({ prefix: "/api/shoots" })
  .post("/all", ({ body }) => listShoots(body), {
    body: FetchAllShootsRequestBodySchema,
    response: FetchAllShootsResponseSchema,
  })
  .get("/by-id/:id", async ({ params: { id }, set }) => {
    const shoot = await fetchShootById(id);
    if (!shoot) {
      set.status = 404;
      return { error: "Shoot not found" };
    }
    return shoot;
  }, {
    params: FetchShootByIdRequestParamsSchema,
    response: {
      200: FetchShootByIdResponseSchema,
      404: t.Object({ error: t.String() }),
    }
  })
  .post("/", ({ body }) => createShoot(body), {
    body: CreateShootRequestBodySchema,
    response: CreateShootResponseSchema,
  })
  .patch("/by-id/:id", async ({ params: { id }, body, set }) => {
    const shoot = await updateShoot(id, body);
    if (!shoot) {
      set.status = 404;
      return { error: "Shoot not found" };
    }
    return shoot;
  }, {
    params: UpdateShootRequestParamsSchema,
    body: UpdateShootRequestBodySchema,
    response: {
      200: UpdateShootResponseSchema,
      404: t.Object({ error: t.String() }),
    },
  })
  .delete("/by-id/:id", async ({ params: { id }, set }) => {
    const success = await deleteShoot(id);
    if (!success) {
      set.status = 404;
      return { error: "Shoot not found" };
    }
    return { success: true };
  }, {
    params: DeleteShootRequestParamsSchema,
    response: {
      200: DeleteShootResponseSchema,
      404: t.Object({ error: t.String() }),
    },
  })
  .get("/by-id/:id/posts", async ({ params: { id } }) => {
    return fetchPostsByShootId(id);
  }, {
    params: t.Object({ id: t.String() }),
    response: FetchPostsByShootIdResponseSchema,
  });

