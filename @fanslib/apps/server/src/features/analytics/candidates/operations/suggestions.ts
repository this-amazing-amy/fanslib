import type { z } from "zod";
import { db } from "../../../../lib/db";
import { FanslyMediaCandidate } from "../../candidate-entity";
import { computeMatchSuggestions } from "../matching";
import type { FetchCandidateSuggestionsResponseSchema } from "../schema";

export const fetchCandidateSuggestions = async (
  id: string
): Promise<z.infer<typeof FetchCandidateSuggestionsResponseSchema> | null> => {
  const dataSource = await db();
  const candidateRepository = dataSource.getRepository(FanslyMediaCandidate);

  const candidate = await candidateRepository.findOne({ where: { id } });
  if (!candidate) {
    return null;
  }

  return computeMatchSuggestions(candidate);
};

