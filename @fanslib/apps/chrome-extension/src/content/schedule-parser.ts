import type { CandidateItem, TimelineResponse } from "./candidate-extractor";
import { extractCandidates } from "./candidate-extractor";
import { debug } from "./debug-log";
import { consumeBufferedAccountMediaId } from "./media-buffer";

// eslint-disable-next-line functional/no-let
let timelineInterceptCount = 0;
// eslint-disable-next-line functional/no-let
let scheduleCaptureCount = 0;

export const processCandidates = (candidates: CandidateItem[]) => {
  if (candidates.length > 0) {
    debug("info", "Posting candidates to window for bridge", {
      candidateCount: candidates.length,
    });

    window.postMessage(
      {
        type: "FANSLIB_TIMELINE_DATA",
        candidates,
      },
      "*",
    );

    debug("info", "Candidates posted to window");
  } else {
    debug("warn", "No candidates extracted from timeline data");
  }
};

type ScheduleRequestBody = {
  content?: string;
  attachments?: Array<{ contentId: string; contentType: number; pos: number }>;
  scheduledFor?: number;
};

export const processScheduleResponse = (
  url: string,
  responseText: string,
  requestBody?: string | null,
) => {
  try {
    type PostData = {
      content?: string;
      attachments?: Array<{ contentId: string }>;
    };

    const data = JSON.parse(responseText) as {
      success: boolean;
      response?: {
        postId?: string;
        postTemplate?: PostData | string;
        post?: PostData | string;
      };
    };

    if (!data.success || !data.response) {
      debug("info", "Schedule parse skipped — not a success response or no response body", {
        url,
        success: data.success,
        hasResponse: !!data.response,
        topLevelKeys: Object.keys(data),
        responseKeys: data.response ? Object.keys(data.response) : [],
      });
      return;
    }

    // postTemplate/post may be a JSON string (Fansly schedule response) or an object
    const rawPostData = data.response.postTemplate ?? data.response.post;
    // eslint-disable-next-line functional/no-let
    let postData: PostData | undefined;
    if (typeof rawPostData === "string") {
      try {
        postData = JSON.parse(rawPostData) as PostData;
        debug("info", "Parsed postTemplate from JSON string", {
          url,
          keys: Object.keys(postData),
        });
      } catch {
        debug("warn", "Failed to parse postTemplate JSON string", { url });
      }
    } else if (rawPostData && typeof rawPostData === "object") {
      postData = rawPostData;
    }

    // Extract Fansly post ID from the top-level response
    const fanslyPostId = data.response.postId;

    // Try to get contentId from response attachments
    // eslint-disable-next-line functional/no-let
    let contentId = postData?.attachments?.[0]?.contentId;
    // eslint-disable-next-line functional/no-let
    let caption = postData?.content ?? "";
    // eslint-disable-next-line functional/no-let
    let source: "response" | "request-body" | "buffered-media" = "response";

    // Fallback: parse the request body — Fansly's POST /api/v1/post request
    // contains attachments and content, but the response may strip them.
    if (!contentId && requestBody) {
      try {
        const reqData = JSON.parse(requestBody) as ScheduleRequestBody;
        debug("info", "Falling back to request body for schedule data", {
          url,
          hasAttachments: !!reqData.attachments,
          attachmentCount: reqData.attachments?.length ?? 0,
          hasContent: !!reqData.content,
          hasScheduledFor: !!reqData.scheduledFor,
        });

        contentId = reqData.attachments?.[0]?.contentId;
        caption = reqData.content ?? caption;
        source = "request-body";
      } catch {
        debug("warn", "Failed to parse request body for schedule fallback", { url });
      }
    }

    // Final fallback: use buffered contentId from a preceding account/media call
    if (!contentId) {
      const buffered = consumeBufferedAccountMediaId();
      if (buffered) {
        contentId = buffered;
        source = "buffered-media";
      }
    }

    if (!contentId) {
      debug("info", "Schedule parse skipped — no contentId from response, request body, or buffer", {
        url,
        hasPostData: !!postData,
        hasAttachments: !!postData?.attachments,
        attachmentCount: postData?.attachments?.length ?? 0,
        hadRequestBody: !!requestBody,
      });
      return;
    }

    scheduleCaptureCount++;
    debug("info", `Schedule capture detected (#${scheduleCaptureCount})`, {
      url,
      contentId,
      fanslyPostId,
      captionLength: caption.length,
      captionPreview: caption.substring(0, 80),
      source,
    });

    window.postMessage(
      {
        type: "FANSLIB_SCHEDULE_CAPTURE",
        contentId,
        caption,
        fanslyPostId,
      },
      "*",
    );

    debug("info", "Schedule capture posted to window");
  } catch (error) {
    debug("error", "Failed to process schedule response", {
      url,
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      responsePreview: responseText?.substring(0, 200),
    });
  }
};

export const processTimelineResponse = (url: string, responseText: string) => {
  timelineInterceptCount++;
  debug("info", `Timeline request detected (#${timelineInterceptCount})`, {
    url,
  });

  try {
    const data = JSON.parse(responseText) as TimelineResponse;

    debug("info", "Timeline response parsed", {
      success: data.success,
      hasPosts: !!data.response?.posts,
      postCount: data.response?.posts?.length ?? 0,
      hasAccountMedia: !!data.response?.accountMedia,
      mediaCount: data.response?.accountMedia?.length ?? 0,
    });

    if (data.success && data.response?.posts) {
      const candidates = extractCandidates(data);
      processCandidates(candidates);
    } else {
      debug("warn", "Timeline response invalid or unsuccessful", {
        success: data.success,
        hasResponse: !!data.response,
        hasPosts: !!data.response?.posts,
      });
    }
  } catch (error) {
    debug("error", "Failed to process timeline response", {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });
  }
};
