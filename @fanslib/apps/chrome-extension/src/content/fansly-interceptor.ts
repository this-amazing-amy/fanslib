import { insertCaptionIntoElement, observeFanslyCaptionInput } from "./caption-inserter";

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

type FanslyCredentials = {
  fanslyAuth?: string;
  fanslySessionId?: string;
  fanslyClientCheck?: string;
  fanslyClientId?: string;
};

const DEBUG_PREFIX = "[FansLib:Interceptor:MainWorld]";

const debug = (level: "info" | "warn" | "error", message: string, data?: unknown) => {
  const timestamp = new Date().toISOString();
  const logArgs =
    data !== undefined
      ? [`[${timestamp}] ${DEBUG_PREFIX} ${message}`, data]
      : [`[${timestamp}] ${DEBUG_PREFIX} ${message}`];

  switch (level) {
    case "info":
      console.log(...logArgs);
      break;
    case "warn":
      console.warn(...logArgs);
      break;
    case "error":
      console.error(...logArgs);
      break;
  }
};

const extractCandidates = (data: TimelineResponse): CandidateItem[] => {
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

debug("info", "Content script starting in MAIN world", {
  location: window.location.href,
  readyState: document.readyState,
  hasChromeRuntime: typeof chrome !== "undefined" && !!chrome?.runtime,
  isMainWorld: typeof chrome === "undefined" || !chrome?.runtime,
});

const originalFetch = window.fetch;
const originalXHROpen = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;
const originalXHRSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

// eslint-disable-next-line functional/no-let
let fetchInterceptCount = 0;
// eslint-disable-next-line functional/no-let
let xhrInterceptCount = 0;
// eslint-disable-next-line functional/no-let
let timelineInterceptCount = 0;
// eslint-disable-next-line functional/no-let
let scheduleCaptureCount = 0;

// Buffer for contentId from account/media creation — Fansly splits
// media creation and post creation into separate API calls.
const ACCOUNT_MEDIA_BUFFER_TTL_MS = 30_000;
// eslint-disable-next-line functional/no-let
let bufferedAccountMediaId: { contentId: string; timestamp: number } | null = null;

const bufferAccountMediaId = (contentId: string) => {
  bufferedAccountMediaId = { contentId, timestamp: Date.now() };
  debug("info", "Buffered account media contentId for upcoming post", {
    contentId,
    ttlMs: ACCOUNT_MEDIA_BUFFER_TTL_MS,
  });
};

const consumeBufferedAccountMediaId = (): string | null => {
  if (!bufferedAccountMediaId) return null;
  const age = Date.now() - bufferedAccountMediaId.timestamp;
  if (age > ACCOUNT_MEDIA_BUFFER_TTL_MS) {
    debug("warn", "Buffered account media contentId expired", {
      contentId: bufferedAccountMediaId.contentId,
      ageMs: age,
    });
    bufferedAccountMediaId = null;
    return null;
  }
  const { contentId } = bufferedAccountMediaId;
  bufferedAccountMediaId = null;
  debug("info", "Consumed buffered account media contentId", { contentId, ageMs: age });
  return contentId;
};

const processCandidates = (candidates: CandidateItem[]) => {
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

const extractCredentialsFromHeaders = (
  headers: HeadersInit | undefined,
): Partial<FanslyCredentials> => {
  const credentials: Partial<FanslyCredentials> = {};

  if (!headers) return credentials;

  const headerMap: Record<string, string> = (() => {
    if (headers instanceof Headers) {
      const result: Record<string, string> = {};
      headers.forEach((value, key) => {
        result[key] = value;
      });
      return result;
    }
    if (Array.isArray(headers)) {
      return Object.fromEntries(headers);
    }
    return headers as Record<string, string>;
  })();

  const getHeader = (name: string): string | undefined => {
    const lowerName = name.toLowerCase();
    const entry = Object.entries(headerMap).find(([key]) => key.toLowerCase() === lowerName);
    return entry ? String(entry[1]) : undefined;
  };

  const auth = getHeader("authorization");
  if (auth) credentials.fanslyAuth = auth;

  const sessionId = getHeader("fansly-session-id");
  if (sessionId) credentials.fanslySessionId = sessionId;

  const clientCheck = getHeader("fansly-client-check");
  if (clientCheck) credentials.fanslyClientCheck = clientCheck;

  const clientId = getHeader("fansly-client-id");
  if (clientId) credentials.fanslyClientId = clientId;

  return credentials;
};

const sendCredentialsIfPresent = (credentials: Partial<FanslyCredentials>): void => {
  const hasCredentials = Object.keys(credentials).length > 0;

  if (hasCredentials) {
    window.postMessage(
      {
        type: "FANSLIB_CREDENTIALS",
        credentials,
      },
      "*",
    );
  }
};

type ScheduleRequestBody = {
  content?: string;
  attachments?: Array<{ contentId: string; contentType: number; pos: number }>;
  scheduledFor?: number;
};

const processScheduleResponse = (
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
      captionLength: caption.length,
      captionPreview: caption.substring(0, 80),
      source,
    });

    window.postMessage(
      {
        type: "FANSLIB_SCHEDULE_CAPTURE",
        contentId,
        caption,
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

const processTimelineResponse = (url: string, responseText: string) => {
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

const extractFetchUrl = (input: Parameters<typeof fetch>[0]): string => {
  if (typeof input === "string") return input;
  if (input instanceof Request) return input.url;
  if (input instanceof URL) return input.toString();
  return String(input ?? "");
};

const interceptedFetch = (async (...args): Promise<Response> => {
  fetchInterceptCount++;
  const [input, init] = args;
  const url = extractFetchUrl(input);

  debug("info", `Fetch intercepted (#${fetchInterceptCount})`, {
    url: url.substring(0, 100),
    method: init?.method ?? "GET",
    inputType: input instanceof Request ? "Request" : input instanceof URL ? "URL" : typeof input,
    isTimeline: url.includes("timelinenew"),
    isFanslyApi: url.includes("fansly.com"),
  });

  if (url.includes("fansly.com")) {
    const credentials = extractCredentialsFromHeaders(init?.headers);
    sendCredentialsIfPresent(credentials);
  }

  const response = await originalFetch(...args);

  if (url.includes("apiv3.fansly.com/api/v1/timelinenew")) {
    debug("info", "Timeline request via fetch detected", {
      url,
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    try {
      const clone = response.clone();
      const responseText = await clone.text();
      processTimelineResponse(url, responseText);
    } catch (error) {
      debug("error", "Failed to process fetch timeline response", {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const method = (init?.method ?? "GET").toUpperCase();
  if (
    url.includes("apiv3.fansly.com") &&
    (method === "POST" || method === "PUT") &&
    !url.includes("timelinenew")
  ) {
    // Buffer contentId from account/media creation responses
    if (url.includes("/api/v1/account/media") && method === "POST") {
      try {
        const amClone = response.clone();
        const amText = await amClone.text();
        const amData = JSON.parse(amText) as {
          success: boolean;
          response?: { accountMedia?: Array<{ id: string }> };
        };
        const amId = amData.response?.accountMedia?.[0]?.id;
        if (amId) {
          bufferAccountMediaId(amId);
        }
      } catch {
        debug("warn", "Failed to parse fetch account/media response for buffering", { url });
      }
    }

    // Capture request body for schedule parsing
    const fetchRequestBody = typeof init?.body === "string" ? init.body : null;

    try {
      const clone = response.clone();
      const responseText = await clone.text();

      debug("info", "Fansly POST/PUT response via fetch — attempting schedule parse", {
        url,
        method,
        status: response.status,
        responseLength: responseText.length,
        hasPostTemplate: responseText.includes("postTemplate"),
        hasPost: responseText.includes('"post"'),
        hasRequestBody: !!fetchRequestBody,
      });

      processScheduleResponse(url, responseText, fetchRequestBody);
    } catch (error) {
      debug("error", "Failed to process fetch schedule response", {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return response;
}) as typeof fetch;

Object.assign(interceptedFetch, originalFetch);
window.fetch = interceptedFetch;

/* eslint-disable functional/no-this-expressions */
XMLHttpRequest.prototype.open = function (method: string, url: string | URL, ...rest: unknown[]) {
  const urlString = typeof url === "string" ? url : url.toString();

  (
    this as XMLHttpRequest & {
      _url?: string;
      _method?: string;
      _headers?: Record<string, string>;
    }
  )._url = urlString;
  (
    this as XMLHttpRequest & {
      _url?: string;
      _method?: string;
      _headers?: Record<string, string>;
    }
  )._method = method;
  (
    this as XMLHttpRequest & {
      _url?: string;
      _method?: string;
      _headers?: Record<string, string>;
    }
  )._headers = {};

  return originalXHROpen.apply(this, [method, url, ...rest] as Parameters<typeof originalXHROpen>);
};

XMLHttpRequest.prototype.setRequestHeader = function (name: string, value: string): void {
  const xhr = this as XMLHttpRequest & {
    _url?: string;
    _headers?: Record<string, string>;
  };
  xhr._headers ??= {};
  xhr._headers[name] = value;
  return originalXHRSetRequestHeader.apply(this, [name, value] as Parameters<
    typeof originalXHRSetRequestHeader
  >);
};

XMLHttpRequest.prototype.send = function (...args: unknown[]) {
  const xhr = this as XMLHttpRequest & {
    _url?: string;
    _method?: string;
    _headers?: Record<string, string>;
  };
  const url = xhr._url ?? "";
  const method = xhr._method ?? "GET";

  // Capture request body for schedule parsing
  const requestBody =
    typeof args[0] === "string" ? args[0] : args[0] instanceof Blob ? null : null;

  xhrInterceptCount++;
  debug("info", `XHR intercepted (#${xhrInterceptCount})`, {
    url: url.substring(0, 100),
    method,
    isTimeline: url.includes("timelinenew"),
    isFanslyApi: url.includes("fansly.com"),
  });

  if (url.includes("fansly.com") && xhr._headers) {
    const credentials = extractCredentialsFromHeaders(xhr._headers);
    sendCredentialsIfPresent(credentials);
  }

  const isTimelineRequest = url.includes("apiv3.fansly.com/api/v1/timelinenew");
  const isAccountMediaCreate =
    url.includes("apiv3.fansly.com/api/v1/account/media") && method === "POST";
  const isScheduleCandidate =
    url.includes("apiv3.fansly.com") &&
    (method === "POST" || method === "PUT") &&
    !url.includes("timelinenew");

  if (isTimelineRequest || isScheduleCandidate) {
    if (isTimelineRequest) {
      debug("info", "Timeline request via XHR detected", { url, method });
    }
    if (isScheduleCandidate) {
      debug("info", "Potential schedule request via XHR detected", { url, method });
    }

    const originalOnLoad = xhr.onload;
    const originalOnReadyStateChange = xhr.onreadystatechange;

    xhr.onreadystatechange = function (this: XMLHttpRequest, ...eventArgs: unknown[]) {
      if (this.readyState === 4 && this.status === 200) {
        if (isTimelineRequest) {
          debug("info", "XHR timeline request completed", {
            status: this.status,
            statusText: this.statusText,
            responseLength: this.responseText?.length,
          });

          try {
            processTimelineResponse(url, this.responseText);
          } catch (error) {
            debug("error", "Failed to process XHR timeline response", {
              error,
              errorMessage: error instanceof Error ? error.message : String(error),
            });
          }
        }

        if (isScheduleCandidate) {
          // Buffer contentId from account/media creation responses
          if (isAccountMediaCreate) {
            try {
              const amData = JSON.parse(this.responseText) as {
                success: boolean;
                response?: { accountMedia?: Array<{ id: string }> };
              };
              const amId = amData.response?.accountMedia?.[0]?.id;
              if (amId) {
                bufferAccountMediaId(amId);
              } else {
                debug("info", "account/media response — no accountMedia id found", {
                  url,
                  responseKeys: amData.response ? Object.keys(amData.response) : [],
                });
              }
            } catch {
              debug("warn", "Failed to parse account/media response for buffering", { url });
            }
          }

          try {
            const responseText = this.responseText;

            debug("info", "Fansly POST/PUT response via XHR — attempting schedule parse", {
              url,
              method,
              status: this.status,
              responseLength: responseText?.length,
              hasPostTemplate: responseText?.includes("postTemplate"),
              hasPost: responseText?.includes('"post"'),
              hasRequestBody: !!requestBody,
            });

            processScheduleResponse(url, responseText, requestBody);
          } catch (error) {
            debug("error", "Failed to process XHR schedule response", {
              error,
              errorMessage: error instanceof Error ? error.message : String(error),
            });
          }
        }
      }

      if (originalOnReadyStateChange) {
        return originalOnReadyStateChange.apply(this, eventArgs as [Event]);
      }
    };

    xhr.onload = function (this: XMLHttpRequest, ...eventArgs: unknown[]) {
      if (isTimelineRequest) {
        debug("info", "XHR onload fired for timeline request", {
          status: this.status,
          responseLength: this.responseText?.length,
        });
      }

      if (originalOnLoad) {
        return originalOnLoad.apply(this, eventArgs as [ProgressEvent]);
      }
    };
  }

  return originalXHRSend.apply(this, args as Parameters<typeof originalXHRSend>);
};
/* eslint-enable functional/no-this-expressions */

debug("info", "Fetch and XHR interception installed in main world");

// --- Caption auto-insert ---

// eslint-disable-next-line functional/no-let
let pendingCaption: string | null = null;
// eslint-disable-next-line functional/no-let
let disconnectObserver: (() => void) | null = null;

const startCaptionObserver = () => {
  disconnectObserver?.();
  disconnectObserver = observeFanslyCaptionInput((textarea) => {
    if (pendingCaption) {
      debug("info", "Caption textarea detected, inserting caption", {
        captionLength: pendingCaption.length,
      });
      insertCaptionIntoElement(textarea, pendingCaption);
    }
  });
};

window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  if (event.data.type === "FANSLIB_INSERT_CAPTION" && event.data.caption) {
    debug("info", "Received insert-caption request", {
      captionLength: event.data.caption.length,
    });
    pendingCaption = event.data.caption;
    startCaptionObserver();
  }
});

debug("info", "Caption auto-insert listener installed");
