import { t } from "elysia";
import { db } from "../../../../lib/db";
import { CandidateStatusSchema, FanslyMediaCandidate } from "../../candidate-entity";

export const GetCandidatesQuerySchema = t.Object({
  status: t.Optional(CandidateStatusSchema),
  limit: t.Optional(t.Number()),
  offset: t.Optional(t.Number()),
});

export const fetchCandidates = async (
  status?: typeof CandidateStatusSchema.static,
  limit = 50,
  offset = 0
): Promise<{ items: FanslyMediaCandidate[]; total: number }> => {
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

