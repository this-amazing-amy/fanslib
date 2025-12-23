import { t } from "elysia";
import { db } from "../../../../lib/db";
import { PostMedia } from "../../../posts/entity";
import { FanslyMediaCandidate, FanslyMediaCandidateSchema } from "../../candidate-entity";

export const UnmatchCandidateRequestParamsSchema = t.Object({
  id: t.String(),
});

export const UnmatchCandidateResponseSchema = FanslyMediaCandidateSchema;

export const unmatchCandidate = async (
  id: string
): Promise<typeof UnmatchCandidateResponseSchema.static> => {
  const dataSource = await db();
  const candidateRepository = dataSource.getRepository(FanslyMediaCandidate);
  const postMediaRepository = dataSource.getRepository(PostMedia);

  const candidate = await candidateRepository.findOneOrFail({
    where: { id },
    relations: { matchedPostMedia: true },
  });

  if (candidate.matchedPostMediaId && candidate.matchedPostMedia) {
    candidate.matchedPostMedia.fanslyStatisticsId = null;
    await postMediaRepository.save(candidate.matchedPostMedia);
  }

  candidate.status = "pending";
  candidate.matchedPostMediaId = null;
  candidate.matchedAt = null;

  await candidateRepository.save(candidate);

  return candidate;
};

