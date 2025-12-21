import { Elysia, t } from "elysia";
import { db } from "../../../lib/db";
import {
  CreateCandidatesRequestSchema,
  FanslyMediaCandidate,
  FanslyMediaCandidateSchema,
  MatchSuggestionSchema,
} from "../candidate-entity";
import { bulkConfirmMatches, BulkConfirmRequestSchema } from "./operations/bulk-confirm";
import { createCandidates } from "./operations/create";
import { fetchCandidates, GetCandidatesQuerySchema } from "./operations/fetch";
import { ignoreCandidate } from "./operations/ignore";
import { confirmMatch } from "./operations/match";
import { computeMatchSuggestions } from "./matching";

export const candidatesRoutes = new Elysia({ prefix: "/candidates" })
  .post("/", async ({ body }) => createCandidates(body.items), {
    body: CreateCandidatesRequestSchema,
    response: t.Array(FanslyMediaCandidateSchema),
  })
  .get("/", async ({ query }) => fetchCandidates(query.status, query.limit, query.offset), {
    query: GetCandidatesQuerySchema,
    response: t.Object({
      items: t.Array(FanslyMediaCandidateSchema),
      total: t.Number(),
    }),
  })
  .get("/by-id/:id/suggestions", async ({ params: { id }, set }) => {
    const dataSource = await db();
    const candidateRepository = dataSource.getRepository(FanslyMediaCandidate);
    const candidate = await candidateRepository.findOne({ where: { id } });
    if (!candidate) {
      set.status = 404;
      return { error: "Candidate not found" };
    }
    return computeMatchSuggestions(candidate);
  }, {
    params: t.Object({ id: t.String() }),
    response: {
      200: t.Array(MatchSuggestionSchema),
      404: t.Object({ error: t.String() }),
    },
  })
  .post("/by-id/:id/match", async ({ params: { id }, body, set }) => {
    try {
      return await confirmMatch(id, body.postMediaId);
    } catch (error) {
      set.status = 404;
      if (error instanceof Error && error.message.includes("Could not find any entity")) {
        return { error: "Candidate or post media not found" };
      }
      throw error;
    }
  }, {
    params: t.Object({ id: t.String() }),
    body: t.Object({ postMediaId: t.String() }),
    response: {
      200: FanslyMediaCandidateSchema,
      404: t.Object({ error: t.String() }),
    },
  })
  .post("/by-id/:id/ignore", async ({ params: { id }, set }) => {
    try {
      return await ignoreCandidate(id);
    } catch (error) {
      set.status = 404;
      if (error instanceof Error && error.message.includes("Could not find any entity")) {
        return { error: "Candidate not found" };
      }
      throw error;
    }
  }, {
    params: t.Object({ id: t.String() }),
    response: {
      200: FanslyMediaCandidateSchema,
      404: t.Object({ error: t.String() }),
    },
  })
  .post("/bulk-confirm", async ({ body }) => bulkConfirmMatches(body.threshold), {
    body: BulkConfirmRequestSchema,
    response: t.Object({
      confirmed: t.Number(),
      failed: t.Number(),
    }),
  });

