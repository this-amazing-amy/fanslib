import { extractCredentialsFromHeaders, sendCredentialsIfPresent } from "./credential-helpers";
import { debug } from "./debug-log";
import { bufferAccountMediaId } from "./media-buffer";
import { processScheduleResponse, processTimelineResponse } from "./schedule-parser";

// eslint-disable-next-line functional/no-let
let xhrInterceptCount = 0;

export const installXhrInterceptor = () => {
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  const originalXHRSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

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
};
