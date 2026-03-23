import { insertCaptionIntoElement, observeFanslyCaptionInput } from "./caption-inserter";
import { debug } from "./debug-log";
import { installFetchInterceptor } from "./fetch-interceptor";
import { installXhrInterceptor } from "./xhr-interceptor";

// Re-export CandidateItem so existing consumers can still import it from here
export type { CandidateItem } from "./candidate-extractor";

debug("info", "Content script starting in MAIN world", {
  location: window.location.href,
  readyState: document.readyState,
  hasChromeRuntime: typeof chrome !== "undefined" && !!chrome?.runtime,
  isMainWorld: typeof chrome === "undefined" || !chrome?.runtime,
});

installFetchInterceptor();
installXhrInterceptor();

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
