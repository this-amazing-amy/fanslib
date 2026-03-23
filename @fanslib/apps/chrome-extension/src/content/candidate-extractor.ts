import { debug } from "./debug-log";

export type TimelineResponse = {
  success: boolean;
  response: {
    posts: Array<{
      id: string;
      content: string | null;
      createdAt: number;
      attachments: Array<{
        postId: string;
        pos: number;
        contentType: number;
        contentId: string;
      }>;
    }>;
    accountMedia: Array<{
      id: string;
      mediaId: string;
      media: {
        filename: string;
      };
    }>;
  };
};

export type CandidateItem = {
  fanslyStatisticsId: string;
  fanslyPostId: string;
  filename: string;
  caption: string | null;
  fanslyCreatedAt: number;
  position: number;
  mediaType: "image" | "video";
};

export const extractCandidates = (data: TimelineResponse): CandidateItem[] => {
  debug("info", "Starting candidate extraction from timeline data", {
    postCount: data.response.posts.length,
    mediaCount: data.response.accountMedia.length,
  });

  const candidates: CandidateItem[] = [];
  const mediaMap = new Map<string, { filename: string }>();

  data.response.accountMedia.forEach((am) => {
    mediaMap.set(am.id, { filename: am.media.filename });
  });

  debug("info", "Media map built", {
    mediaMapSize: mediaMap.size,
    sampleMediaIds: Array.from(mediaMap.keys()).slice(0, 3),
  });

  data.response.posts.forEach((post, postIndex) => {
    debug("info", `Processing post ${postIndex + 1}/${data.response.posts.length}`, {
      postId: post.id,
      attachmentCount: post.attachments.length,
      hasCaption: !!post.content,
      captionLength: post.content?.length,
      createdAt: post.createdAt,
    });

    post.attachments.forEach((attachment, attachmentIndex) => {
      const mediaInfo = mediaMap.get(attachment.contentId);
      if (!mediaInfo) {
        debug("warn", `No media info found for attachment`, {
          contentId: attachment.contentId,
          postId: post.id,
          attachmentIndex,
        });
        return;
      }

      const filename = mediaInfo.filename;
      const isVideo = filename.match(/\.(mp4|webm|mov|avi)$/i) !== null;

      const candidate: CandidateItem = {
        fanslyStatisticsId: attachment.contentId,
        fanslyPostId: post.id,
        filename,
        caption: post.content,
        fanslyCreatedAt: post.createdAt,
        position: attachment.pos,
        mediaType: isVideo ? "video" : "image",
      };

      debug("info", `Extracted candidate ${attachmentIndex + 1}/${post.attachments.length}`, {
        statisticsId: candidate.fanslyStatisticsId,
        filename: candidate.filename,
        mediaType: candidate.mediaType,
        position: candidate.position,
      });

      candidates.push(candidate);
    });
  });

  debug("info", "Candidate extraction complete", {
    totalCandidates: candidates.length,
    imageCount: candidates.filter((c) => c.mediaType === "image").length,
    videoCount: candidates.filter((c) => c.mediaType === "video").length,
  });

  return candidates;
};
