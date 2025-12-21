import { db } from "../../../../lib/db";
import { PostMedia } from "../../../posts/entity";
import { FanslyMediaCandidate } from "../../candidate-entity";

export const confirmMatch = async (
  candidateId: string,
  postMediaId: string
): Promise<FanslyMediaCandidate> => {
  const dataSource = await db();
  const candidateRepository = dataSource.getRepository(FanslyMediaCandidate);
  const postMediaRepository = dataSource.getRepository(PostMedia);

  const candidate = await candidateRepository.findOneOrFail({
    where: { id: candidateId },
  });

  const postMedia = await postMediaRepository.findOneOrFail({
    where: { id: postMediaId },
  });

  candidate.status = "matched";
  candidate.matchedPostMediaId = postMediaId;
  candidate.matchedAt = new Date();
  if (!candidate.matchMethod) {
    candidate.matchMethod = "manual";
  }

  await candidateRepository.save(candidate);

  postMedia.fanslyStatisticsId = candidate.fanslyStatisticsId;
  await postMediaRepository.save(postMedia);

  return candidate;
};

