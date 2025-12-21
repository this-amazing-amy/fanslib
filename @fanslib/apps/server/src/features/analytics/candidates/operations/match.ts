import { t } from "elysia";
import { db } from "../../../../lib/db";
import { PostMedia } from "../../../posts/entity";
import { FanslyMediaCandidate, FanslyMediaCandidateSchema } from "../../candidate-entity";

export const ConfirmMatchRequestParamsSchema = t.Object({
  id: t.String(),
});

export const ConfirmMatchRequestBodySchema = t.Object({
  postMediaId: t.String(),
});

export const ConfirmMatchResponseSchema = FanslyMediaCandidateSchema;

export const confirmMatch = async (
  id: string,
  body: typeof ConfirmMatchRequestBodySchema.static
): Promise<typeof ConfirmMatchResponseSchema.static> => {
  const dataSource = await db();
  const candidateRepository = dataSource.getRepository(FanslyMediaCandidate);
  const postMediaRepository = dataSource.getRepository(PostMedia);

  const candidate = await candidateRepository.findOneOrFail({
    where: { id },
  });

  const postMedia = await postMediaRepository.findOneOrFail({
    where: { id: body.postMediaId },
  });

  candidate.status = "matched";
  candidate.matchedPostMediaId = body.postMediaId;
  candidate.matchedAt = new Date();
  if (!candidate.matchMethod) {
    candidate.matchMethod = "manual";
  }

  await candidateRepository.save(candidate);

  postMedia.fanslyStatisticsId = candidate.fanslyStatisticsId;
  await postMediaRepository.save(postMedia);

  return candidate;
};
