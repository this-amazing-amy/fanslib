import { t } from "elysia";
import { db } from "../../../../lib/db";
import { CreateCandidateSchema, FanslyMediaCandidate, FanslyMediaCandidateSchema } from "../../candidate-entity";
import { computeMatchSuggestions } from "../matching";

export const CreateCandidatesRequestBodySchema = t.Object({
  items: t.Array(CreateCandidateSchema),
});

export const CreateCandidatesResponseSchema = t.Array(FanslyMediaCandidateSchema);

type CandidateItem = typeof CreateCandidateSchema.static;

export const createCandidates = async (
  body: typeof CreateCandidatesRequestBodySchema.static
): Promise<typeof CreateCandidatesResponseSchema.static> => {
  const dataSource = await db();
  const candidateRepository = dataSource.getRepository(FanslyMediaCandidate);

  const results = await Promise.all(
    body.items.map(async (item: CandidateItem) => {
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
