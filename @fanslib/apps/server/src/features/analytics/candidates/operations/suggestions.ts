import { t } from "elysia";
import { db } from "../../../../lib/db";
import { FanslyMediaCandidate, MatchSuggestionSchema } from "../../candidate-entity";
import { computeMatchSuggestions } from "../matching";

export const FetchCandidateSuggestionsRequestParamsSchema = t.Object({
  id: t.String(),
});

export const FetchCandidateSuggestionsResponseSchema = t.Array(MatchSuggestionSchema);

export const fetchCandidateSuggestions = async (
  id: string
): Promise<typeof FetchCandidateSuggestionsResponseSchema.static | null> => {
  const dataSource = await db();
  const candidateRepository = dataSource.getRepository(FanslyMediaCandidate);

  const candidate = await candidateRepository.findOne({ where: { id } });
  if (!candidate) {
    return null;
  }

  return computeMatchSuggestions(candidate);
};

