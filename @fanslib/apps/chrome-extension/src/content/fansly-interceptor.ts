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
  mediaType: 'image' | 'video';
};

type FanslyCredentials = {
  fanslyAuth?: string;
  fanslySessionId?: string;
  fanslyClientCheck?: string;
  fanslyClientId?: string;
};

const DEBUG_PREFIX = '[FansLib:Interceptor:MainWorld]';

const debug = (
  level: 'info' | 'warn' | 'error',
  message: string,
  data?: unknown
) => {
  const timestamp = new Date().toISOString();
  const logArgs =
    data !== undefined
      ? [`[${timestamp}] ${DEBUG_PREFIX} ${message}`, data]
      : [`[${timestamp}] ${DEBUG_PREFIX} ${message}`];

  switch (level) {
    case 'info':
      console.log(...logArgs);
      break;
    case 'warn':
      console.warn(...logArgs);
      break;
    case 'error':
      console.error(...logArgs);
      break;
  }
};

const extractCandidates = (data: TimelineResponse): CandidateItem[] => {
  debug('info', 'Starting candidate extraction from timeline data', {
    postCount: data.response.posts.length,
    mediaCount: data.response.accountMedia.length,
  });

  const candidates: CandidateItem[] = [];
  const mediaMap = new Map<string, { filename: string }>();

  data.response.accountMedia.forEach((am) => {
    mediaMap.set(am.id, { filename: am.media.filename });
  });

  debug('info', 'Media map built', {
    mediaMapSize: mediaMap.size,
    sampleMediaIds: Array.from(mediaMap.keys()).slice(0, 3),
  });

  data.response.posts.forEach((post, postIndex) => {
    debug(
      'info',
      `Processing post ${postIndex + 1}/${data.response.posts.length}`,
      {
        postId: post.id,
        attachmentCount: post.attachments.length,
        hasCaption: !!post.content,
        captionLength: post.content?.length,
        createdAt: post.createdAt,
      }
    );

    post.attachments.forEach((attachment, attachmentIndex) => {
      const mediaInfo = mediaMap.get(attachment.contentId);
      if (!mediaInfo) {
        debug('warn', `No media info found for attachment`, {
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
        mediaType: isVideo ? 'video' : 'image',
      };

      debug(
        'info',
        `Extracted candidate ${attachmentIndex + 1}/${post.attachments.length}`,
        {
          statisticsId: candidate.fanslyStatisticsId,
          filename: candidate.filename,
          mediaType: candidate.mediaType,
          position: candidate.position,
        }
      );

      candidates.push(candidate);
    });
  });

  debug('info', 'Candidate extraction complete', {
    totalCandidates: candidates.length,
    imageCount: candidates.filter((c) => c.mediaType === 'image').length,
    videoCount: candidates.filter((c) => c.mediaType === 'video').length,
  });

  return candidates;
};

debug('info', 'Content script starting in MAIN world', {
  location: window.location.href,
  readyState: document.readyState,
  hasChromeRuntime: typeof chrome !== 'undefined' && !!chrome?.runtime,
  isMainWorld: typeof chrome === 'undefined' || !chrome?.runtime,
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

const processCandidates = (candidates: CandidateItem[]) => {
  if (candidates.length > 0) {
    debug('info', 'Posting candidates to window for bridge', {
      candidateCount: candidates.length,
    });

    window.postMessage(
      {
        type: 'FANSLIB_TIMELINE_DATA',
        candidates,
      },
      '*'
    );

    debug('info', 'Candidates posted to window');
  } else {
    debug('warn', 'No candidates extracted from timeline data');
  }
};

const extractCredentialsFromHeaders = (
  headers: HeadersInit | undefined
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
    const entry = Object.entries(headerMap).find(
      ([key]) => key.toLowerCase() === lowerName
    );
    return entry ? String(entry[1]) : undefined;
  };

  const auth = getHeader('authorization');
  if (auth) credentials.fanslyAuth = auth;

  const sessionId = getHeader('fansly-session-id');
  if (sessionId) credentials.fanslySessionId = sessionId;

  const clientCheck = getHeader('fansly-client-check');
  if (clientCheck) credentials.fanslyClientCheck = clientCheck;

  const clientId = getHeader('fansly-client-id');
  if (clientId) credentials.fanslyClientId = clientId;

  return credentials;
};

const sendCredentialsIfPresent = (
  credentials: Partial<FanslyCredentials>
): void => {
  const hasCredentials = Object.keys(credentials).length > 0;

  if (hasCredentials) {
    window.postMessage(
      {
        type: 'FANSLIB_CREDENTIALS',
        credentials,
      },
      '*'
    );
  }
};

const processTimelineResponse = (url: string, responseText: string) => {
  timelineInterceptCount++;
  debug('info', `Timeline request detected (#${timelineInterceptCount})`, {
    url,
  });

  try {
    const data = JSON.parse(responseText) as TimelineResponse;

    debug('info', 'Timeline response parsed', {
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
      debug('warn', 'Timeline response invalid or unsuccessful', {
        success: data.success,
        hasResponse: !!data.response,
        hasPosts: !!data.response?.posts,
      });
    }
  } catch (error) {
    debug('error', 'Failed to process timeline response', {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });
  }
};

const interceptedFetch = (async (...args): Promise<Response> => {
  fetchInterceptCount++;
  const [input, init] = args;
  const url = typeof input === 'string' ? input : (input?.toString() ?? '');

  debug('info', `Fetch intercepted (#${fetchInterceptCount})`, {
    url: url.substring(0, 100),
    method: init?.method ?? 'GET',
    isTimeline: url.includes('timelinenew'),
    isFanslyApi: url.includes('fansly.com'),
  });

  if (url.includes('fansly.com')) {
    const credentials = extractCredentialsFromHeaders(init?.headers);
    sendCredentialsIfPresent(credentials);
  }

  const response = await originalFetch(...args);

  if (url.includes('apiv3.fansly.com/api/v1/timelinenew')) {
    debug('info', 'Timeline request via fetch detected', {
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
      debug('error', 'Failed to process fetch timeline response', {
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
XMLHttpRequest.prototype.open = function (
  method: string,
  url: string | URL,
  ...rest: unknown[]
) {
  const urlString = typeof url === 'string' ? url : url.toString();

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

  return originalXHROpen.apply(this, [method, url, ...rest] as Parameters<
    typeof originalXHROpen
  >);
};

XMLHttpRequest.prototype.setRequestHeader = function (
  name: string,
  value: string
): void {
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
  const url = xhr._url ?? '';
  const method = xhr._method ?? 'GET';

  xhrInterceptCount++;
  debug('info', `XHR intercepted (#${xhrInterceptCount})`, {
    url: url.substring(0, 100),
    method,
    isTimeline: url.includes('timelinenew'),
    isFanslyApi: url.includes('fansly.com'),
  });

  if (url.includes('fansly.com') && xhr._headers) {
    const credentials = extractCredentialsFromHeaders(xhr._headers);
    sendCredentialsIfPresent(credentials);
  }

  if (url.includes('apiv3.fansly.com/api/v1/timelinenew')) {
    debug('info', 'Timeline request via XHR detected', { url, method });

    const originalOnLoad = xhr.onload;
    const originalOnReadyStateChange = xhr.onreadystatechange;

    xhr.onreadystatechange = function (
      this: XMLHttpRequest,
      ...eventArgs: unknown[]
    ) {
      if (this.readyState === 4 && this.status === 200) {
        debug('info', 'XHR timeline request completed', {
          status: this.status,
          statusText: this.statusText,
          responseLength: this.responseText?.length,
        });

        try {
          processTimelineResponse(url, this.responseText);
        } catch (error) {
          debug('error', 'Failed to process XHR timeline response', {
            error,
            errorMessage:
              error instanceof Error ? error.message : String(error),
          });
        }
      }

      if (originalOnReadyStateChange) {
        return originalOnReadyStateChange.apply(this, eventArgs as [Event]);
      }
    };

    xhr.onload = function (this: XMLHttpRequest, ...eventArgs: unknown[]) {
      debug('info', 'XHR onload fired for timeline request', {
        status: this.status,
        responseLength: this.responseText?.length,
      });

      if (originalOnLoad) {
        return originalOnLoad.apply(this, eventArgs as [ProgressEvent]);
      }
    };
  }

  return originalXHRSend.apply(
    this,
    args as Parameters<typeof originalXHRSend>
  );
};
/* eslint-enable functional/no-this-expressions */

debug('info', 'Fetch and XHR interception installed in main world');

export {};
