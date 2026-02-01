import type { z } from "zod";
import { db } from "../../../../lib/db";
import { FanslyMediaCandidate } from "../../candidate-entity";
import type { IgnoreCandidateResponseSchema } from "../schema";

export const ignoreCandidate = async (
  id: string
): Promise<z.infer<typeof IgnoreCandidateResponseSchema>> => {
  const dataSource = await db();
  const candidateRepository = dataSource.getRepository(FanslyMediaCandidate);

  const candidate = await candidateRepository.findOneOrFail({
    where: { id },
  });

  candidate.status = "ignored";
  await candidateRepository.save(candidate);

  return candidate;
};
