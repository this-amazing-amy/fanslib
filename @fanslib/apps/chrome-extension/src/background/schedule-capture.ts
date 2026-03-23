import { addLogEntry } from "../lib/activity-log";
import { eden } from "../lib/api";
import { debug, getApiUrl } from "./config";

export const sendScheduleCapture = async (
  contentId: string,
  caption: string,
): Promise<{ matched: boolean; postId: string | null }> => {
  debug("info", "Sending schedule capture to server", { contentId, captionLength: caption.length });

  const apiUrl = await getApiUrl();
  if (!apiUrl) return { matched: false, postId: null };
  const api = eden(apiUrl);

  try {
    const response = await api.api.posts["schedule-capture"].$post({
      json: { contentId, caption },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = (await response.json()) as { matched: boolean; postId: string | null };

    debug("info", "Schedule capture result", { matched: result.matched, postId: result.postId });

    if (result.matched) {
      await addLogEntry({
        type: "success",
        message: "Linked '" + caption.slice(0, 40) + "' to post",
      });
    } else {
      await addLogEntry({
        type: "warning",
        message: "Unrecognized post scheduled: '" + caption.slice(0, 40) + "'",
      });
    }

    await chrome.storage.local.set({
      lastScheduleCaptureResult: {
        matched: result.matched,
        postId: result.postId,
        timestamp: Date.now(),
      },
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    debug("error", "Failed to send schedule capture", { error: errorMessage });

    await addLogEntry({ type: "error", message: "Schedule capture failed: " + errorMessage });

    await chrome.storage.local.set({
      lastScheduleCaptureResult: {
        matched: false,
        postId: null,
        timestamp: Date.now(),
        error: errorMessage,
      },
    });

    throw error;
  }
};
