import { db } from "../../../lib/db";
import { Post } from "../../posts/entity";
import { PostMedia } from "../../posts/entity";
import { FanslyAnalyticsAggregate } from "../entity";
import { identifyFypTrackableId } from "./fyp/preview-heuristic";

type Attachment = {
  fanslyStatisticsId: string;
  duration: number;
};

type LinkResult = {
  success: boolean;
  linkedPostMediaId: string;
};

/**
 * Links a FansLib post to its Fansly counterpart by matching the preview PostMedia
 * to the correct attachment via duration matching.
 */
export const linkPost = async (
  postId: string,
  attachments: Attachment[],
): Promise<LinkResult | "not_found" | "no_match"> => {
  const database = await db();
  const postRepo = database.getRepository(Post);
  const postMediaRepo = database.getRepository(PostMedia);
  const aggregateRepo = database.getRepository(FanslyAnalyticsAggregate);

  // Load post with PostMedia + Media
  const post = await postRepo.findOne({
    where: { id: postId },
    relations: ["postMedia", "postMedia.media"],
  });

  if (!post) return "not_found";

  const postMediaList = post.postMedia ?? [];
  if (postMediaList.length === 0) return "no_match";

  // Identify the preview PostMedia using the heuristic
  const previewId = identifyFypTrackableId(
    postMediaList.map((pm) => ({
      id: pm.id,
      order: pm.order,
      mediaType: pm.media?.type ?? null,
      duration: pm.media?.duration ?? null,
    })),
  );

  if (!previewId) return "no_match";

  const previewPm = postMediaList.find((pm) => pm.id === previewId);
  if (!previewPm) return "no_match";

  const previewDuration = previewPm.media?.duration ?? null;

  // Match by duration — find the attachment whose duration is closest to the preview
  const DURATION_TOLERANCE = 2; // seconds
  const matchedAttachment = attachments.find((att) => {
    if (previewDuration === null) return false;
    return Math.abs(att.duration - previewDuration) <= DURATION_TOLERANCE;
  });

  if (!matchedAttachment) return "no_match";

  // Set fanslyStatisticsId on the preview PostMedia
  previewPm.fanslyStatisticsId = matchedAttachment.fanslyStatisticsId;
  await postMediaRepo.save(previewPm);

  // Create FanslyAnalyticsAggregate for immediate tracking
  const existingAggregate = await aggregateRepo.findOne({ where: { postMediaId: previewPm.id } });
  if (!existingAggregate) {
    const aggregate = aggregateRepo.create({
      postMediaId: previewPm.id,
      totalViews: 0,
      averageEngagementSeconds: 0,
      averageEngagementPercent: 0,
      nextFetchAt: new Date(), // immediate tracking
    });
    await aggregateRepo.save(aggregate);
  }

  // Cross-direction cleanup: auto-resolve matching FanslyMediaCandidate
  try {
    const candidateRepo = database.getRepository("FanslyMediaCandidate");
    const candidate = await candidateRepo.findOne({
      where: { fanslyStatisticsId: matchedAttachment.fanslyStatisticsId },
    });
    if (candidate) {
      const c = candidate as Record<string, unknown>;
      c.status = "matched";
      c.matchedPostMediaId = previewPm.id;
      await candidateRepo.save(candidate);
    }
  } catch {
    // FanslyMediaCandidate may not exist in all environments
  }

  return { success: true, linkedPostMediaId: previewPm.id };
};
