import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { validationError } from "../../lib/hono-utils";
import { assignMediaToSchedules } from "./operations/assign-media";
import { fetchCaptionQueue } from "./operations/fetch-caption-queue";
import {
  AssignMediaRequestBodySchema,
  FetchCaptionQueueRequestQuerySchema,
} from "./schema";

export const pipelineRoutes = new Hono()
  .basePath("/api/pipeline")
  .post("/assign", zValidator("json", AssignMediaRequestBodySchema, validationError), async (c) => {
    const body = c.req.valid("json");
    const result = await assignMediaToSchedules(body);
    return c.json(result);
  })
  .get("/caption-queue", zValidator("query", FetchCaptionQueueRequestQuerySchema, validationError), async (c) => {
    const query = c.req.valid("query");
    const result = await fetchCaptionQueue(query);
    return c.json(result);
  })
  .get("/health", async (c) => c.json({ status: "ok" }));
