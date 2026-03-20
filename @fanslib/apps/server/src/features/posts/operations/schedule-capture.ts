import { z } from "zod";
import { db } from "../../../lib/db";
import { calculateSimilarity } from "../../analytics/candidates/matching";
import { FanslyAnalyticsAggregate } from "../../analytics/entity";
import { Post, PostMedia } from "../entity";

export const ScheduleCaptureRequestBodySchema = z.object({
  contentId: z.string(),
  caption: z.string(),
});

export type ScheduleCaptureResult = {
  matched: boolean;
  postId?: string;
  similarity?: number;
};

const SIMILARITY_THRESHOLD = 0.9;
const INITIAL_FETCH_INTERVAL_DAYS = 1;

export const processScheduleCapture = async (
  input: z.infer<typeof ScheduleCaptureRequestBodySchema>,
): Promise<ScheduleCaptureResult> => {
  const dataSource = await db();
  const postRepo = dataSource.getRepository(Post);
  const postMediaRepo = dataSource.getRepository(PostMedia);
  const aggregateRepo = dataSource.getRepository(FanslyAnalyticsAggregate);

  // Find ready Fansly posts
  const readyPosts = await postRepo
    .createQueryBuilder("post")
    .leftJoinAndSelect("post.channel", "channel")
    .leftJoinAndSelect("post.postMedia", "postMedia")
    .where("post.status = :status", { status: "ready" })
    .andWhere("channel.typeId = :typeId", { typeId: "fansly" })
    .andWhere("post.caption IS NOT NULL")
    .orderBy("post.date", "ASC")
    .getMany();

  // Find best caption match
  const matches = readyPosts
    .map((post) => ({
      post,
      similarity: calculateSimilarity(post.caption ?? "", input.caption),
    }))
    .filter((m) => m.similarity >= SIMILARITY_THRESHOLD)
    .sort((a, b) => b.similarity - a.similarity);

  if (matches.length === 0) {
    return { matched: false };
  }

  const bestMatch = matches[0];
  const post = bestMatch.post;

  // Update post status to "scheduled"
  await postRepo.update(post.id, { status: "scheduled" });

  // Link first PostMedia (attachments[0]) with fanslyStatisticsId
  const firstPostMedia = [...post.postMedia].sort((a, b) => a.order - b.order)[0];
  if (firstPostMedia) {
    await postMediaRepo.update(firstPostMedia.id, {
      fanslyStatisticsId: input.contentId,
    });

    // Create or update aggregate with initial nextFetchAt
    const existingAggregate = await aggregateRepo.findOne({
      where: { postMediaId: firstPostMedia.id },
    });

    if (existingAggregate) {
      existingAggregate.nextFetchAt = new Date(Date.now() + INITIAL_FETCH_INTERVAL_DAYS * 24 * 60 * 60 * 1000);
      await aggregateRepo.save(existingAggregate);
    } else {
      const aggregate = aggregateRepo.create({
        postMediaId: firstPostMedia.id,
        postMedia: firstPostMedia,
        totalViews: 0,
        averageEngagementSeconds: 0,
        averageEngagementPercent: 0,
        nextFetchAt: new Date(Date.now() + INITIAL_FETCH_INTERVAL_DAYS * 24 * 60 * 60 * 1000),
      });
      await aggregateRepo.save(aggregate);
    }
  }

  return {
    matched: true,
    postId: post.id,
    similarity: bestMatch.similarity,
  };
};
