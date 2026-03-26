import type { z } from "zod";
import { db } from "../../../../lib/db";
import { Post, PostMedia } from "../../../posts/entity";
import { FanslyMediaCandidate } from "../../candidate-entity";
import { FanslyAnalyticsAggregate } from "../../entity";
import { isFypTrackable } from "../../operations/fyp/preview-heuristic";
import type { ConfirmMatchRequestBodySchema, ConfirmMatchResponseSchema } from "../schema";

const INITIAL_FETCH_INTERVAL_DAYS = 1;

const loadSiblingPostMedia = async (postMediaId: string) => {
  const dataSource = await db();
  const pm = await dataSource.getRepository(PostMedia).findOne({
    where: { id: postMediaId },
    relations: { post: true },
  });
  if (!pm) return [];

  const post = await dataSource.getRepository(Post).findOne({
    where: { id: pm.post.id },
    relations: { postMedia: true },
  });
  if (!post) return [];

  const allPm = await Promise.all(
    post.postMedia.map((sibling) =>
      dataSource.getRepository(PostMedia).findOne({
        where: { id: sibling.id },
        relations: { media: true },
      }),
    ),
  );

  return allPm
    .filter((p): p is PostMedia => p !== null)
    .map((p) => ({
      id: p.id,
      order: p.order,
      mediaType: p.media?.type ?? null,
      duration: p.media?.duration ?? null,
    }));
};

export const confirmMatch = async (
  id: string,
  body: z.infer<typeof ConfirmMatchRequestBodySchema>,
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

  const siblings = await loadSiblingPostMedia(body.postMediaId);
  const shouldTrack = isFypTrackable(body.postMediaId, siblings);

  if (shouldTrack) {
    const aggregateRepository = dataSource.getRepository(FanslyAnalyticsAggregate);
    const existingAggregate = await aggregateRepository.findOne({
      where: { postMediaId: body.postMediaId },
    });

    if (existingAggregate) {
      existingAggregate.nextFetchAt = new Date(
        Date.now() + INITIAL_FETCH_INTERVAL_DAYS * 24 * 60 * 60 * 1000,
      );
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
  }

  return candidate;
};
