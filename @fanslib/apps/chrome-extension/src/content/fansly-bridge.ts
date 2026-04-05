import { createDebugLogger } from "../lib/debug";

const debug = createDebugLogger("[FansLib:Bridge]");

// eslint-disable-next-line functional/no-let
let contextInvalidated = false;

const BANNER_ID = "fanslib-context-invalidated-banner";

const showRefreshBanner = () => {
  if (document.getElementById(BANNER_ID)) return;

  const banner = document.createElement("div");
  banner.id = BANNER_ID;
  banner.style.cssText = [
    "position: fixed",
    "top: 0",
    "left: 0",
    "right: 0",
    "z-index: 2147483647",
    "background: #b91c1c",
    "color: white",
    "padding: 10px 16px",
    "font-family: system-ui, sans-serif",
    "font-size: 14px",
    "text-align: center",
    "cursor: pointer",
    "box-shadow: 0 2px 8px rgba(0,0,0,0.3)",
  ].join(";");
  banner.textContent = "FansLib extension was updated — click here to refresh and resume tracking";
  banner.addEventListener("click", () => window.location.reload());

  const append = () => {
    if (document.body) {
      document.body.appendChild(banner);
    } else {
      requestAnimationFrame(append);
    }
  };
  append();
};

const handleContextInvalidated = (source: string) => {
  if (!contextInvalidated) {
    contextInvalidated = true;
    debug("error", "Extension context invalidated — bridge is dead, user must refresh page", {
      detectedDuring: source,
    });
    showRefreshBanner();
  }
};

const isContextInvalidatedError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("Extension context invalidated");
};

const sendToBackground = (message: Record<string, unknown>, source: string): void => {
  if (contextInvalidated) {
    debug("warn", `Skipping ${source} — context already invalidated`);
    return;
  }

  try {
    if (!chrome?.runtime?.id) {
      handleContextInvalidated(source);
      return;
    }

    chrome.runtime
      .sendMessage(message)
      .then(() => {
        debug("info", `${source} sent successfully to background script`);
      })
      .catch((error) => {
        if (isContextInvalidatedError(error)) {
          handleContextInvalidated(source);
        } else {
          debug("error", `Failed to send ${source} to background script`, {
            error,
            errorMessage: error instanceof Error ? error.message : String(error),
          });
        }
      });
  } catch (error) {
    if (isContextInvalidatedError(error)) {
      handleContextInvalidated(source);
    } else {
      debug("error", `Failed to forward ${source}`, {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    }
  }
};

debug("info", "Bridge script starting in ISOLATED world", {
  location: window.location.href,
  hasChromeRuntime: typeof chrome !== "undefined" && !!chrome.runtime,
  hasChromeRuntimeId: typeof chrome !== "undefined" && !!chrome.runtime?.id,
});

window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  if (event.data.type === "FANSLIB_TIMELINE_DATA") {
    debug("info", "Received timeline data from MAIN world", {
      candidateCount: event.data.candidates?.length,
    });

    sendToBackground(
      {
        type: "FANSLY_TIMELINE_DATA",
        candidates: event.data.candidates,
      },
      "timeline data",
    );
  }

  if (event.data.type === "FANSLIB_SCHEDULE_CAPTURE") {
    debug("info", "Received schedule capture from MAIN world", {
      contentId: event.data.contentId,
      fanslyPostId: event.data.fanslyPostId,
      captionLength: event.data.caption?.length,
    });

    sendToBackground(
      {
        type: "FANSLIB_SCHEDULE_CAPTURE",
        contentId: event.data.contentId,
        caption: event.data.caption,
        fanslyPostId: event.data.fanslyPostId,
      },
      "schedule capture",
    );
  }

  if (event.data.type === "FANSLIB_CREDENTIALS") {
    debug("info", "Received credentials from MAIN world", {
      hasAuth: !!event.data.credentials?.fanslyAuth,
      hasSessionId: !!event.data.credentials?.fanslySessionId,
    });

    sendToBackground(
      {
        type: "FANSLY_CREDENTIALS",
        credentials: event.data.credentials,
      },
      "credentials",
    );
  }
});

debug("info", "Bridge message listener installed");

// Listen for messages from background script (reverse channel: background → content → MAIN world)
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "FANSLIB_INSERT_CAPTION") {
    debug("info", "Received insert-caption from background", {
      captionLength: message.caption?.length,
    });

    window.postMessage(
      {
        type: "FANSLIB_INSERT_CAPTION",
        caption: message.caption,
      },
      "*",
    );
  }
});

debug("info", "Bridge reverse-channel listener installed");

export {};
