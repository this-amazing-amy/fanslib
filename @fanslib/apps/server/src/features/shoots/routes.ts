import type { FetchAllShootsRequest, CreateShootRequest, UpdateShootRequest } from "@fanslib/types";
import { Elysia } from "elysia";
import { createShoot } from "./operations/shoot/create";
import { deleteShoot } from "./operations/shoot/delete";
import { listShoots } from "./operations/shoot/fetch-all";
import { getShoot } from "./operations/shoot/fetch-by-id";
import { updateShoot } from "./operations/shoot/update";

export const shootsRoutes = new Elysia({ prefix: "/api/shoots" })
  .get("/", async ({ query }) => {
    const request: FetchAllShootsRequest = {
      page: query.page ? parseInt(query.page as string) : undefined,
      limit: query.limit ? parseInt(query.limit as string) : undefined,
      filter: query.filter ? JSON.parse(query.filter as string) : undefined,
    };
    return listShoots(request);
  })
  .get("/:id", async ({ params: { id } }) => {
    const shoot = await getShoot(id);
    if (!shoot) {
      return { error: "Shoot not found" };
    }
    return shoot;
  })
  .post("/", async ({ body }) => createShoot(body as CreateShootRequest))
  .patch("/:id", async ({ params: { id }, body }) => updateShoot(id, body as UpdateShootRequest))
  .delete("/:id", async ({ params: { id } }) => {
    await deleteShoot(id);
    return { success: true };
  });

