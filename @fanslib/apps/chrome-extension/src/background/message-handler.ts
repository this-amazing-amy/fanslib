import type { CandidateItem } from "../content/fansly-interceptor";
import { addToBuffer } from "./candidate-sync";
import { sendCredentialsToServer } from "./credential-sync";
import { sendScheduleCapture } from "./schedule-capture";

type Message =
  | {
      type: "FANSLY_TIMELINE_DATA";
      candidates: CandidateItem[];
    }
  | {
      type: "FANSLY_CREDENTIALS";
      credentials: {
        fanslyAuth?: string;
        fanslySessionId?: string;
        fanslyClientCheck?: string;
        fanslyClientId?: string;
      };
    }
  | {
      type: "FANSLIB_SCHEDULE_CAPTURE";
      contentId: string;
      caption: string;
    }
  | {
      type: "FANSLIB_INSERT_CAPTION";
      caption: string;
      fanslyPostId?: string;
    };

export const registerMessageHandler = () => {
  chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
    if (message.type === "FANSLY_TIMELINE_DATA") {
      addToBuffer(message.candidates);
      sendResponse({ success: true });
      return true;
    }

    if (message.type === "FANSLY_CREDENTIALS") {
      sendCredentialsToServer(message.credentials).catch(() => {
        // Silently fail - credentials will be retried on next capture
      });
      sendResponse({ success: true });
      return true;
    }

    if (message.type === "FANSLIB_INSERT_CAPTION") {
      // Forward caption to the active Fansly tab's content script
      chrome.tabs.query({ url: "https://fansly.com/*" }, (tabs) => {
        tabs
          .map((tab) => tab.id)
          .filter((id): id is number => id != null)
          .forEach((tabId) => {
            chrome.tabs.sendMessage(tabId, {
              type: "FANSLIB_INSERT_CAPTION",
              caption: message.caption,
            });
          });
      });
      sendResponse({ success: true });
      return true;
    }

    if (message.type === "FANSLIB_SCHEDULE_CAPTURE") {
      sendScheduleCapture(message.contentId, message.caption)
        .then((result) => {
          sendResponse({ success: true, ...result });
        })
        .catch((error) => {
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        });
      return true;
    }

    return false;
  });
};
