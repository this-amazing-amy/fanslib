import { t } from "elysia";
import { db } from "../../../../lib/db";
import { FanslyMediaCandidate } from "../../candidate-entity";
import { confirmMatch } from "./match";

export const BulkConfirmCandidatesRequestBodySchema = t.Object({
  threshold: t.Number(),
});

export const BulkConfirmCandidatesResponseSchema = t.Object({
  confirmed: t.Number(),
  failed: t.Number(),
});

export const bulkConfirmCandidates = async (
  body: typeof BulkConfirmCandidatesRequestBodySchema.static
): Promise<typeof BulkConfirmCandidatesResponseSchema.static> => {
  const dataSource = await db();
  const candidateRepository = dataSource.getRepository(FanslyMediaCandidate);

  const candidates = await candidateRepository.find({
    where: {
      status: "pending",
    },
  });

  const highConfidenceCandidates = candidates.filter(
    (c) => c.matchConfidence !== null && c.matchConfidence >= body.threshold && c.matchMethod !== null
  );

  let confirmed = 0;
  let failed = 0;

  await Promise.all(
    highConfidenceCandidates.map(async (candidate) => {
      if (candidate.matchMethod === "exact_filename" || candidate.matchMethod === "fuzzy_filename") {
        const suggestions = await import("../matching").then((m) =>
          m.computeMatchSuggestions(candidate)
        );
        if (suggestions.length > 0 && suggestions[0]) {
          try {
            await confirmMatch(candidate.id, { postMediaId: suggestions[0].postMediaId });
            confirmed++;
          } catch {
            failed++;
          }
        } else {
          failed++;
        }
      } else {
        failed++;
      }
    })
  );

  return { confirmed, failed };
};
