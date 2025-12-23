import { t } from "elysia";
import { db } from "../../../../lib/db";
import { FanslyMediaCandidate, FanslyMediaCandidateSchema } from "../../candidate-entity";

export const UnignoreCandidateRequestParamsSchema = t.Object({
  id: t.String(),
});

export const UnignoreCandidateResponseSchema = FanslyMediaCandidateSchema;

export const unignoreCandidate = async (
  id: string
): Promise<typeof UnignoreCandidateResponseSchema.static> => {
  const dataSource = await db();
  const candidateRepository = dataSource.getRepository(FanslyMediaCandidate);

  const candidate = await candidateRepository.findOneOrFail({
    where: { id },
  });

  candidate.status = "pending";
  await candidateRepository.save(candidate);

  return candidate;
};

