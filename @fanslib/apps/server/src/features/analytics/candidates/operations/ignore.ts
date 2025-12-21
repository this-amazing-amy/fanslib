import { t } from "elysia";
import { db } from "../../../../lib/db";
import { FanslyMediaCandidate, FanslyMediaCandidateSchema } from "../../candidate-entity";

export const IgnoreCandidateRequestParamsSchema = t.Object({
  id: t.String(),
});

export const IgnoreCandidateResponseSchema = FanslyMediaCandidateSchema;

export const ignoreCandidate = async (
  id: string
): Promise<typeof IgnoreCandidateResponseSchema.static> => {
  const dataSource = await db();
  const candidateRepository = dataSource.getRepository(FanslyMediaCandidate);

  const candidate = await candidateRepository.findOneOrFail({
    where: { id },
  });

  candidate.status = "ignored";
  await candidateRepository.save(candidate);

  return candidate;
};
