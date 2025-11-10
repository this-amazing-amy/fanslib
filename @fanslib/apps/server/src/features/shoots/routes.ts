import { Elysia } from "elysia";
import { CreateShootRequestBodySchema, CreateShootResponseSchema, createShoot } from "./operations/shoot/create";
import { DeleteShootResponseSchema, deleteShoot } from "./operations/shoot/delete";
import { FetchAllShootsRequestBodySchema, FetchAllShootsResponseSchema, listShoots } from "./operations/shoot/fetch-all";
import { UpdateShootRequestBodySchema, UpdateShootResponseSchema, updateShoot } from "./operations/shoot/update";

export const shootsRoutes = new Elysia({ prefix: "/api/shoots" })
  .post("/fetch-all", ({ body }) => listShoots(body), {
    body: FetchAllShootsRequestBodySchema,
    response: FetchAllShootsResponseSchema,
  })
  .post("/", ({ body }) => createShoot(body), {
    body: CreateShootRequestBodySchema,
    response: CreateShootResponseSchema,
  })
  .patch("/:id", ({ params: { id }, body }) => updateShoot(id, body), {
    body: UpdateShootRequestBodySchema,
    response: UpdateShootResponseSchema,
  })
  .delete("/:id", ({ params: { id } }) => deleteShoot(id), {
    response: DeleteShootResponseSchema,
  });

