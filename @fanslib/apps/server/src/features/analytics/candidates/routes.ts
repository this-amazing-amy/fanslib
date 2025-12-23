import { Elysia, t } from "elysia";
import { BulkConfirmCandidatesRequestBodySchema, BulkConfirmCandidatesResponseSchema, bulkConfirmCandidates } from "./operations/bulk-confirm";
import { CreateCandidatesRequestBodySchema, CreateCandidatesResponseSchema, createCandidates } from "./operations/create";
import { FetchAllCandidatesRequestQuerySchema, FetchAllCandidatesResponseSchema, fetchAllCandidates } from "./operations/fetch";
import { IgnoreCandidateRequestParamsSchema, IgnoreCandidateResponseSchema, ignoreCandidate } from "./operations/ignore";
import { ConfirmMatchRequestBodySchema, ConfirmMatchRequestParamsSchema, ConfirmMatchResponseSchema, confirmMatch } from "./operations/match";
import { FetchCandidateSuggestionsRequestParamsSchema, FetchCandidateSuggestionsResponseSchema, fetchCandidateSuggestions } from "./operations/suggestions";
import { UnignoreCandidateRequestParamsSchema, UnignoreCandidateResponseSchema, unignoreCandidate } from "./operations/unignore";
import { UnmatchCandidateRequestParamsSchema, UnmatchCandidateResponseSchema, unmatchCandidate } from "./operations/unmatch";

export const candidatesRoutes = new Elysia({ prefix: "/candidates" })
  .post("/", async ({ body }) => createCandidates(body), {
    body: CreateCandidatesRequestBodySchema,
    response: CreateCandidatesResponseSchema,
  })
  .get("/", async ({ query }) => fetchAllCandidates(query), {
    query: FetchAllCandidatesRequestQuerySchema,
    response: FetchAllCandidatesResponseSchema,
  })
  .get("/by-id/:id/suggestions", async ({ params: { id }, set }) => {
    const suggestions = await fetchCandidateSuggestions(id);
    if (!suggestions) {
      set.status = 404;
      return { error: "Candidate not found" };
    }
    return suggestions;
  }, {
    params: FetchCandidateSuggestionsRequestParamsSchema,
    response: {
      200: FetchCandidateSuggestionsResponseSchema,
      404: t.Object({ error: t.String() }),
    },
  })
  .post("/by-id/:id/match", async ({ params, body, set }) => {
    try {
      return await confirmMatch(params.id, body);
    } catch (error) {
      set.status = 404;
      if (error instanceof Error && error.message.includes("Could not find any entity")) {
        return { error: "Candidate or post media not found" };
      }
      throw error;
    }
  }, {
    params: ConfirmMatchRequestParamsSchema,
    body: ConfirmMatchRequestBodySchema,
    response: {
      200: ConfirmMatchResponseSchema,
      404: t.Object({ error: t.String() }),
    },
  })
  .post("/by-id/:id/ignore", async ({ params, set }) => {
    try {
      return await ignoreCandidate(params.id);
    } catch (error) {
      set.status = 404;
      if (error instanceof Error && error.message.includes("Could not find any entity")) {
        return { error: "Candidate not found" };
      }
      throw error;
    }
  }, {
    params: IgnoreCandidateRequestParamsSchema,
    response: {
      200: IgnoreCandidateResponseSchema,
      404: t.Object({ error: t.String() }),
    },
  })
  .post("/bulk-confirm", async ({ body }) => bulkConfirmCandidates(body), {
    body: BulkConfirmCandidatesRequestBodySchema,
    response: BulkConfirmCandidatesResponseSchema,
  })
  .post("/by-id/:id/unmatch", async ({ params, set }) => {
    try {
      return await unmatchCandidate(params.id);
    } catch (error) {
      set.status = 404;
      if (error instanceof Error && error.message.includes("Could not find any entity")) {
        return { error: "Candidate not found" };
      }
      throw error;
    }
  }, {
    params: UnmatchCandidateRequestParamsSchema,
    response: {
      200: UnmatchCandidateResponseSchema,
      404: t.Object({ error: t.String() }),
    },
  })
  .post("/by-id/:id/unignore", async ({ params, set }) => {
    try {
      return await unignoreCandidate(params.id);
    } catch (error) {
      set.status = 404;
      if (error instanceof Error && error.message.includes("Could not find any entity")) {
        return { error: "Candidate not found" };
      }
      throw error;
    }
  }, {
    params: UnignoreCandidateRequestParamsSchema,
    response: {
      200: UnignoreCandidateResponseSchema,
      404: t.Object({ error: t.String() }),
    },
  });
