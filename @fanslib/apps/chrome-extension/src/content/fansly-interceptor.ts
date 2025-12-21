type TimelineResponse = {
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

const extractCandidates = (data: TimelineResponse): CandidateItem[] => {
  const candidates: CandidateItem[] = [];
  const mediaMap = new Map<string, { filename: string }>();

  data.response.accountMedia.forEach((am) => {
    mediaMap.set(am.id, { filename: am.media.filename });
  });

  data.response.posts.forEach((post) => {
    post.attachments.forEach((attachment) => {
      const mediaInfo = mediaMap.get(attachment.contentId);
      if (!mediaInfo) return;

      const filename = mediaInfo.filename;
      const isVideo = filename.match(/\.(mp4|webm|mov|avi)$/i) !== null;

      candidates.push({
        fanslyStatisticsId: attachment.contentId,
        fanslyPostId: post.id,
        filename,
        caption: post.content,
        fanslyCreatedAt: post.createdAt,
        position: attachment.pos,
        mediaType: isVideo ? "video" : "image",
      });
    });
  });

  return candidates;
};

const interceptFetch = (): void => {
  const originalFetch = window.fetch.bind(window);

  const interceptedFetch = async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    const response = await originalFetch(input, init);
    const url = input?.toString() || "";

    if (url.includes("apiv3.fansly.com/api/v1/timelinenew")) {
      try {
        const clone = response.clone();
        const data: TimelineResponse = await clone.json();

        if (data.success && data.response?.posts) {
          const candidates = extractCandidates(data);
          if (candidates.length > 0) {
            chrome.runtime.sendMessage({
              type: "FANSLY_TIMELINE_DATA",
              candidates,
            }).catch(() => {
            });
          }
        }
      } catch (error) {
        console.error("[FansLib] Failed to process timeline data:", error);
      }
    }

    return response;
  };

  window.fetch = interceptedFetch as typeof window.fetch;
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", interceptFetch);
} else {
  interceptFetch();
}

export {};

