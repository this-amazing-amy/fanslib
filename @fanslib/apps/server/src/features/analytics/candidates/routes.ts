import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { validationError } from "../../../lib/hono-utils";
import { bulkConfirmCandidates } from "./operations/bulk-confirm";
import { createCandidates } from "./operations/create";
import { fetchAllCandidates } from "./operations/fetch";
import { ignoreCandidate } from "./operations/ignore";
import { confirmMatch } from "./operations/match";
import { fetchCandidateSuggestions } from "./operations/suggestions";
import { unignoreCandidate } from "./operations/unignore";
import { unmatchCandidate } from "./operations/unmatch";
import {
  BulkConfirmCandidatesRequestBodySchema,
  ConfirmMatchRequestBodySchema,
  ConfirmMatchRequestParamsSchema,
  CreateCandidatesRequestBodySchema,
  FetchAllCandidatesRequestQuerySchema,
  FetchCandidateSuggestionsRequestParamsSchema,
  IgnoreCandidateRequestParamsSchema,
  UnignoreCandidateRequestParamsSchema,
  UnmatchCandidateRequestParamsSchema,
} from "./schema";

export const candidatesRoutes = new Hono()
  .basePath("/api/analytics/candidates")
  .post("/", zValidator("json", CreateCandidatesRequestBodySchema, validationError), async (c) => {
    const body = c.req.valid("json");
    const result = await createCandidates(body);
    return c.json(result);
  })
  .get("/", zValidator("query", FetchAllCandidatesRequestQuerySchema, validationError), async (c) => {
    const query = c.req.valid("query");
    const result = await fetchAllCandidates(query);
    return c.json(result);
  })
  .get("/by-id/:id/suggestions", zValidator("param", FetchCandidateSuggestionsRequestParamsSchema, validationError), async (c) => {
    const { id } = c.req.valid("param");
    const suggestions = await fetchCandidateSuggestions(id);
    if (!suggestions) {
      return c.json({ error: "Candidate not found" }, 404);
    }
    return c.json(suggestions);
  })
  .post(
    "/by-id/:id/match",
    zValidator("param", ConfirmMatchRequestParamsSchema, validationError),
    zValidator("json", ConfirmMatchRequestBodySchema, validationError),
    async (c) => {
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");
      try {
        const result = await confirmMatch(id, body);
        return c.json(result);
      } catch (error) {
        if (error instanceof Error && error.message.includes("Could not find any entity")) {
          return c.json({ error: "Candidate or post media not found" }, 404);
        }
        throw error;
      }
    }
  )
  .post("/by-id/:id/ignore", zValidator("param", IgnoreCandidateRequestParamsSchema, validationError), async (c) => {
    const { id } = c.req.valid("param");
    try {
      const result = await ignoreCandidate(id);
      return c.json(result);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Could not find any entity")) {
        return c.json({ error: "Candidate not found" }, 404);
      }
      throw error;
    }
  })
  .post("/bulk-confirm", zValidator("json", BulkConfirmCandidatesRequestBodySchema, validationError), async (c) => {
    const body = c.req.valid("json");
    const result = await bulkConfirmCandidates(body);
    return c.json(result);
  })
  .post("/by-id/:id/unmatch", zValidator("param", UnmatchCandidateRequestParamsSchema, validationError), async (c) => {
    const { id } = c.req.valid("param");
    try {
      const result = await unmatchCandidate(id);
      return c.json(result);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Could not find any entity")) {
        return c.json({ error: "Candidate not found" }, 404);
      }
      throw error;
    }
  })
  .post("/by-id/:id/unignore", zValidator("param", UnignoreCandidateRequestParamsSchema, validationError), async (c) => {
    const { id } = c.req.valid("param");
    try {
      const result = await unignoreCandidate(id);
      return c.json(result);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Could not find any entity")) {
        return c.json({ error: "Candidate not found" }, 404);
      }
      throw error;
    }
  });
