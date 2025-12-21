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
  .get("/by-id/:id/suggestions", async ({ params: { id } }) => {
    const dataSource = await db();
    const candidateRepository = dataSource.getRepository(FanslyMediaCandidate);
    const candidate = await candidateRepository.findOneOrFail({ where: { id } });
    return computeMatchSuggestions(candidate);
  }, {
    params: t.Object({ id: t.String() }),
    response: t.Array(MatchSuggestionSchema),
  })
  .post("/by-id/:id/match", async ({ params: { id }, body }) => confirmMatch(id, body.postMediaId), {
    params: t.Object({ id: t.String() }),
    body: t.Object({ postMediaId: t.String() }),
    response: FanslyMediaCandidateSchema,
  })
  .post("/by-id/:id/ignore", async ({ params: { id } }) => ignoreCandidate(id), {
    params: t.Object({ id: t.String() }),
    response: FanslyMediaCandidateSchema,
  })
  .post("/bulk-confirm", async ({ body }) => bulkConfirmMatches(body.threshold), {
    body: BulkConfirmRequestSchema,
    response: t.Object({
      confirmed: t.Number(),
      failed: t.Number(),
    }),
  });

