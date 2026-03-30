import { db } from "../../../lib/db";
import { Post, PostMedia } from "../../posts/entity";
import { identifyFypTrackableId } from "./fyp/preview-heuristic";

type UnlinkedPost = {
  postId: string;
  caption: string | null;
  postedDate: Date;
  previewThumbnailUrl: string | null;
  previewDuration: number | null;
  previewMediaId: string | null;
};

export const fetchUnlinkedPosts = async (): Promise<{
  posts: UnlinkedPost[];
  total: number;
}> => {
  const database = await db();
  const postRepo = database.getRepository(Post);

  // Fetch all posted posts with channel and post media
  const posts = await postRepo.find({
    where: { status: "posted" },
    relations: ["channel", "postMedia", "postMedia.media"],
    order: { date: "DESC" },
  });

  // Filter to Fansly channels and unlinked previews
  const unlinkedPosts: UnlinkedPost[] = [];

  posts.forEach((post) => {
    // Only Fansly channels
    if (post.channel?.typeId !== "fansly") return;
    if (!post.postMedia || post.postMedia.length === 0) return;

    const previewId = identifyFypTrackableId(
      post.postMedia.map((pm) => ({
        id: pm.id,
        order: pm.order,
        mediaType: pm.media?.type ?? null,
        duration: pm.media?.duration ?? null,
      })),
    );

    if (!previewId) return;

    const previewPm = post.postMedia.find((pm) => pm.id === previewId);
    if (!previewPm) return;

    // Skip if already linked or dismissed
    if (previewPm.fanslyStatisticsId) return;
    if (previewPm.analyticsLinkSkipped) return;

    unlinkedPosts.push({
      postId: post.id,
      caption: post.caption ?? null,
      postedDate: post.date,
      previewThumbnailUrl: previewPm.media
        ? `/api/media/${previewPm.media.id}/thumbnail`
        : null,
      previewDuration: previewPm.media?.duration ?? null,
      previewMediaId: previewPm.media?.id ?? null,
    });
  });

  return {
    posts: unlinkedPosts,
    total: unlinkedPosts.length,
  };
};

export const dismissUnlinkedPost = async (
  postMediaId: string,
): Promise<"not_found" | "ok"> => {
  const database = await db();
  const postMediaRepo = database.getRepository(PostMedia);

  const pm = await postMediaRepo.findOne({ where: { id: postMediaId } });
  if (!pm) return "not_found";

  pm.analyticsLinkSkipped = true;
  await postMediaRepo.save(pm);
  return "ok";
};
