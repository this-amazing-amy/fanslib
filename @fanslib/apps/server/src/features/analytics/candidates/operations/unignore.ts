import type { z } from "zod";
import { db } from "../../../../lib/db";
import { FanslyMediaCandidate } from "../../candidate-entity";
import type { UnignoreCandidateResponseSchema } from "../schema";

export const unignoreCandidate = async (
  id: string
): Promise<z.infer<typeof UnignoreCandidateResponseSchema>> => {
  const dataSource = await db();
  const candidateRepository = dataSource.getRepository(FanslyMediaCandidate);

  const candidate = await candidateRepository.findOneOrFail({
    where: { id },
  });

  candidate.status = "pending";
  await candidateRepository.save(candidate);

  return candidate;
};

