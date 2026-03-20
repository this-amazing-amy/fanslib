import type { z } from "zod";
import { db } from "../../../../lib/db";
import { PostMedia } from "../../../posts/entity";
import { FanslyMediaCandidate } from "../../candidate-entity";
import { FanslyAnalyticsAggregate } from "../../entity";
import type { ConfirmMatchRequestBodySchema, ConfirmMatchResponseSchema } from "../schema";

const INITIAL_FETCH_INTERVAL_DAYS = 1;

export const confirmMatch = async (
  id: string,
  body: z.infer<typeof ConfirmMatchRequestBodySchema>
): Promise<z.infer<typeof ConfirmMatchResponseSchema> | null> => {
  const dataSource = await db();
  const candidateRepository = dataSource.getRepository(FanslyMediaCandidate);
  const postMediaRepository = dataSource.getRepository(PostMedia);

  const candidate = await candidateRepository.findOne({
    where: { id },
  });

  if (!candidate) return null;

  const postMedia = await postMediaRepository.findOne({
    where: { id: body.postMediaId },
  });

  if (!postMedia) return null;

  const existingMatch = await candidateRepository.findOne({
    where: { matchedPostMediaId: body.postMediaId },
    relations: { matchedPostMedia: true },
  });

  if (existingMatch && existingMatch.id !== id) {
    if (existingMatch.matchedPostMedia) {
      existingMatch.matchedPostMedia.fanslyStatisticsId = null;
      await postMediaRepository.save(existingMatch.matchedPostMedia);
    }
    existingMatch.status = "pending";
    existingMatch.matchedPostMediaId = null;
    existingMatch.matchedAt = null;
    await candidateRepository.save(existingMatch);
  }

  candidate.status = "matched";
  candidate.matchedPostMediaId = body.postMediaId;
  candidate.matchedAt = new Date();
  candidate.matchMethod ??= "manual";

  await candidateRepository.save(candidate);

  postMedia.fanslyStatisticsId = candidate.fanslyStatisticsId;
  await postMediaRepository.save(postMedia);

  // Create or update aggregate with initial nextFetchAt
  const aggregateRepository = dataSource.getRepository(FanslyAnalyticsAggregate);
  const existingAggregate = await aggregateRepository.findOne({
    where: { postMediaId: body.postMediaId },
  });

  if (existingAggregate) {
    existingAggregate.nextFetchAt = new Date(Date.now() + INITIAL_FETCH_INTERVAL_DAYS * 24 * 60 * 60 * 1000);
    await aggregateRepository.save(existingAggregate);
  } else {
    const aggregate = aggregateRepository.create({
      postMediaId: body.postMediaId,
      postMedia,
      totalViews: 0,
      averageEngagementSeconds: 0,
      averageEngagementPercent: 0,
      nextFetchAt: new Date(Date.now() + INITIAL_FETCH_INTERVAL_DAYS * 24 * 60 * 60 * 1000),
    });
    await aggregateRepository.save(aggregate);
  }

  return candidate;
};
