import { t } from "elysia";
import { db } from "../../../../lib/db";
import { CandidateStatusSchema, FanslyMediaCandidate, FanslyMediaCandidateSchema } from "../../candidate-entity";

export const FetchAllCandidatesRequestQuerySchema = t.Object({
  status: t.Optional(CandidateStatusSchema),
  limit: t.Optional(t.Numeric()),
  offset: t.Optional(t.Numeric()),
});

export const FetchAllCandidatesResponseSchema = t.Object({
  items: t.Array(FanslyMediaCandidateSchema),
  total: t.Number(),
});

export const fetchAllCandidates = async (
  params?: typeof FetchAllCandidatesRequestQuerySchema.static
): Promise<typeof FetchAllCandidatesResponseSchema.static> => {
  const status = params?.status;
  const limit = params?.limit ?? 50;
  const offset = params?.offset ?? 0;

  const dataSource = await db();
  const candidateRepository = dataSource.getRepository(FanslyMediaCandidate);

  const queryBuilder = candidateRepository.createQueryBuilder("candidate");

  if (status) {
    queryBuilder.where("candidate.status = :status", { status });
  }

  const total = await queryBuilder.getCount();

  const items = await queryBuilder
    .orderBy("candidate.capturedAt", "DESC")
    .skip(offset)
    .take(limit)
    .getMany();

  return { items, total };
};
