import { db } from "../../../../lib/db";
import type { CreateCandidatesRequestSchema } from "../../candidate-entity";
import { FanslyMediaCandidate } from "../../candidate-entity";
import { computeMatchSuggestions } from "../matching";

type CandidateItem = typeof CreateCandidatesRequestSchema.static.items[number];

export const createCandidates = async (
  items: CandidateItem[]
): Promise<FanslyMediaCandidate[]> => {
  const dataSource = await db();
  const candidateRepository = dataSource.getRepository(FanslyMediaCandidate);

  const results = await Promise.all(
    items.map(async (item: CandidateItem) => {
      const existing = await candidateRepository.findOne({
        where: { fanslyStatisticsId: item.fanslyStatisticsId },
      });

      if (existing) {
        return existing;
      }

      const candidate = candidateRepository.create({
        ...item,
        status: "pending",
      });

      const saved = await candidateRepository.save(candidate);

      const suggestions = await computeMatchSuggestions(saved);
      if (suggestions.length > 0 && suggestions[0]) {
        saved.matchConfidence = suggestions[0].confidence;
        saved.matchMethod = suggestions[0].method;
        await candidateRepository.save(saved);
      }

      return saved;
    })
  );

  return results;
};

