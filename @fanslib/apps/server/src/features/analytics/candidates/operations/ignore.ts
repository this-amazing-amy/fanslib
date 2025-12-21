import { db } from "../../../../lib/db";
import { FanslyMediaCandidate } from "../../candidate-entity";

export const ignoreCandidate = async (candidateId: string): Promise<FanslyMediaCandidate> => {
  const dataSource = await db();
  const candidateRepository = dataSource.getRepository(FanslyMediaCandidate);

  const candidate = await candidateRepository.findOneOrFail({
    where: { id: candidateId },
  });

  candidate.status = "ignored";
  await candidateRepository.save(candidate);

  return candidate;
};

