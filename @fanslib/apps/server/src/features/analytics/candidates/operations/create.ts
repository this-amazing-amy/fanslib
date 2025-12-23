import { t } from "elysia";
import { db } from "../../../../lib/db";
import { CreateCandidateSchema, FanslyMediaCandidate, FanslyMediaCandidateSchema } from "../../candidate-entity";
import { PostMedia } from "../../../posts/entity";
import { computeMatchSuggestions } from "../matching";

export const CreateCandidatesRequestBodySchema = t.Object({
  items: t.Array(CreateCandidateSchema),
});

export const CandidateCreationResultSchema = t.Object({
  candidate: FanslyMediaCandidateSchema,
  status: t.Union([
    t.Literal("created"),
    t.Literal("existing"),
    t.Literal("already_matched"),
  ]),
});

export const CreateCandidatesResponseSchema = t.Array(CandidateCreationResultSchema);

type CandidateItem = typeof CreateCandidateSchema.static;

export const createCandidates = async (
  body: typeof CreateCandidatesRequestBodySchema.static
): Promise<typeof CreateCandidatesResponseSchema.static> => {
  const dataSource = await db();
  const candidateRepository = dataSource.getRepository(FanslyMediaCandidate);
  const postMediaRepository = dataSource.getRepository(PostMedia);

  const results = await Promise.all(
    body.items.map(async (item: CandidateItem) => {
      const existing = await candidateRepository.findOne({
        where: { fanslyStatisticsId: item.fanslyStatisticsId },
      });

      if (existing) {
        return {
          candidate: existing,
          status: "existing" as const,
        };
      }

      const alreadyMatchedPostMedia = await postMediaRepository.findOne({
        where: { fanslyStatisticsId: item.fanslyStatisticsId },
      });

      if (alreadyMatchedPostMedia) {
        const candidate = candidateRepository.create({
          ...item,
          status: "matched",
          matchedPostMediaId: alreadyMatchedPostMedia.id,
          matchedAt: new Date(),
          matchMethod: "auto_detected",
        });
        const saved = await candidateRepository.save(candidate);
        return {
          candidate: saved,
          status: "already_matched" as const,
        };
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

      return {
        candidate: saved,
        status: "created" as const,
      };
    })
  );

  return results;
};
