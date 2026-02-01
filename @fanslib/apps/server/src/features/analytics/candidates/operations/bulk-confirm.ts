import type { z } from "zod";
import { db } from "../../../../lib/db";
import { FanslyMediaCandidate } from "../../candidate-entity";
import { confirmMatch } from "./match";
import type { BulkConfirmCandidatesRequestBodySchema, BulkConfirmCandidatesResponseSchema } from "../schema";

export const bulkConfirmCandidates = async (
  body: z.infer<typeof BulkConfirmCandidatesRequestBodySchema>
): Promise<z.infer<typeof BulkConfirmCandidatesResponseSchema>> => {
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

  const results = await Promise.all(
    highConfidenceCandidates.map(async (candidate) => {
      if (candidate.matchMethod !== "exact_filename" && candidate.matchMethod !== "fuzzy_filename") {
        return { confirmed: 0, failed: 1 };
      }

      const suggestions = await import("../matching").then((m) =>
        m.computeMatchSuggestions(candidate)
      );

      if (suggestions.length === 0 || !suggestions[0]) {
        return { confirmed: 0, failed: 1 };
      }

      return confirmMatch(candidate.id, { postMediaId: suggestions[0].postMediaId })
        .then(() => ({ confirmed: 1, failed: 0 }))
        .catch(() => ({ confirmed: 0, failed: 1 }));
    })
  );

  const totals = results.reduce(
    (acc, result) => ({
      confirmed: acc.confirmed + result.confirmed,
      failed: acc.failed + result.failed,
    }),
    { confirmed: 0, failed: 0 }
  );

  return totals;
};
