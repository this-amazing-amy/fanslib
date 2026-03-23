import { extractCredentialsFromHeaders, sendCredentialsIfPresent } from "./credential-helpers";
import { debug } from "./debug-log";
import { bufferAccountMediaId } from "./media-buffer";
import { processScheduleResponse, processTimelineResponse } from "./schedule-parser";

// eslint-disable-next-line functional/no-let
let fetchInterceptCount = 0;

const extractFetchUrl = (input: Parameters<typeof fetch>[0]): string => {
  if (typeof input === "string") return input;
  if (input instanceof Request) return input.url;
  if (input instanceof URL) return input.toString();
  return String(input ?? "");
};

export const installFetchInterceptor = () => {
  const originalFetch = window.fetch;

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
};
