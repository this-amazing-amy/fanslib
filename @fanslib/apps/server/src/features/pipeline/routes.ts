import { Elysia, t } from "elysia";
import {
  AssignMediaRequestBodySchema,
  AssignMediaResponseSchema,
  assignMediaToSchedules,
} from "./operations/assign-media";
import {
  FetchCaptionQueueRequestQuerySchema,
  FetchCaptionQueueResponseSchema,
  fetchCaptionQueue,
} from "./operations/fetch-caption-queue";

export const pipelineRoutes = new Elysia({ prefix: "/api/pipeline" })
  .post("/assign", async ({ body }) => assignMediaToSchedules(body), {
    body: AssignMediaRequestBodySchema,
    response: AssignMediaResponseSchema,
  })
  .get("/caption-queue", async ({ query }) => fetchCaptionQueue(query), {
    query: FetchCaptionQueueRequestQuerySchema,
    response: FetchCaptionQueueResponseSchema,
  })
  .get("/health", () => ({ status: "ok" }), {
    response: t.Object({ status: t.String() }),
  });
