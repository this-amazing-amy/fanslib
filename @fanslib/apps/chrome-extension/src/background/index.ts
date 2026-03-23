import { addLogEntry } from "../lib/activity-log";
import { eden } from "../lib/api";
import type { CandidateItem } from "../content/fansly-interceptor";

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
    }
  | {
      type: "FANSLIB_INSERT_CAPTION";
      caption: string;
      fanslyPostId?: string;
    };

const BATCH_DELAY_MS = 2000;
const MAX_BATCH_SIZE = 50;

const SETTINGS_KEY_API_URL = "fanslib_api_url";
const DEFAULT_API_URL = "http://localhost:6970";

const candidateBuffer: CandidateItem[] = [];
// eslint-disable-next-line functional/no-let
let batchTimeout: ReturnType<typeof setTimeout> | null = null;

import { createDebugLogger } from "../lib/debug";

const debug = createDebugLogger("[FansLib:Background]");

const getApiUrl = async (): Promise<string | null> => {
  debug("info", "Fetching API URL from storage");
  const result = await chrome.storage.local.get(SETTINGS_KEY_API_URL);
  const storedApiUrl = result[SETTINGS_KEY_API_URL];
  const apiUrl =
    typeof storedApiUrl === "string" && storedApiUrl.trim() !== ""
      ? storedApiUrl.replace(/\/+$/, "")
      : null;
  debug("info", "API URL retrieved", {
    apiUrl: apiUrl ?? DEFAULT_API_URL,
    hasApiUrl: apiUrl !== null,
    isDefault: apiUrl === null,
  });
  return apiUrl ?? DEFAULT_API_URL;
};

type SyncResult = {
  created: number;
  existing: number;
  alreadyMatched: number;
};

const CREDENTIALS_THROTTLE_MS = 60000;

const sendCredentialsToServer = async (credentials: {
  fanslyAuth?: string;
  fanslySessionId?: string;
  fanslyClientCheck?: string;
  fanslyClientId?: string;
}): Promise<void> => {
  const storage = await chrome.storage.local.get(["lastCredentialsSentAt", "pendingCredentials"]);
  const lastSentAt = storage.lastCredentialsSentAt ?? 0;
  const now = Date.now();
  const timeSinceLastSend = now - lastSentAt;

  const filteredCredentials = Object.fromEntries(
    Object.entries(credentials).filter(
      ([_, value]) => value !== undefined && value !== null && value !== "",
    ),
  );

  if (timeSinceLastSend < CREDENTIALS_THROTTLE_MS) {
    await chrome.storage.local.set({
      pendingCredentials: filteredCredentials,
    });
    return;
  }

  const apiUrl = await getApiUrl();
  if (!apiUrl) return;
  const api = eden(apiUrl);

  try {
    const response = await api.api.settings["fansly-credentials"].$post({
      json: filteredCredentials,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    await chrome.storage.local.set({
      lastCredentialsUpdateAt: now,
      lastCredentialsSentAt: now,
      lastCredentialsError: null,
      pendingCredentials: null,
    });

    await addLogEntry({ type: "success", message: "Credentials refreshed" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    await chrome.storage.local.set({
      lastCredentialsError: errorMessage,
      lastCredentialsErrorAt: now,
      pendingCredentials: filteredCredentials,
    });

    await addLogEntry({ type: "error", message: "Credential refresh failed: " + errorMessage });
  }
};

const sendCandidates = async (candidates: CandidateItem[]): Promise<void> => {
  debug("info", "Starting to send candidates to API", {
    candidateCount: candidates.length,
    candidateIds: candidates.map((c) => c.fanslyStatisticsId).slice(0, 5),
    showingFirst: Math.min(5, candidates.length),
  });

  const apiUrl = await getApiUrl();
  if (!apiUrl) return;
  const api = eden(apiUrl);

  debug("info", "Sending POST request to API", {
    endpoint: `${apiUrl}/api/analytics/candidates`,
    candidateCount: candidates.length,
  });

  await chrome.storage.local.set({ isSyncing: true });

  try {
    const response = await api.api.analytics.candidates.$post({
      json: { items: candidates },
    });

    debug("info", "API response received", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = (await response.json()) as Array<{
      candidate: unknown;
      status: "created" | "existing" | "already_matched";
    }>;

    const syncResult: SyncResult = {
      created: result.filter((r) => r.status === "created").length,
      existing: result.filter((r) => r.status === "existing").length,
      alreadyMatched: result.filter((r) => r.status === "already_matched").length,
    };

    debug("info", "Candidates sent successfully", {
      sentCount: candidates.length,
      resultCount: result.length,
      syncResult,
    });

    const syncTimestamp = Date.now();
    await chrome.storage.local.set({
      lastSyncAt: syncTimestamp,
      lastSyncCount: candidates.length,
      lastSyncCreated: syncResult.created,
      lastSyncExisting: syncResult.existing,
      lastSyncAlreadyMatched: syncResult.alreadyMatched,
      lastSyncError: null,
      lastSyncErrorAt: null,
      isSyncing: false,
    });

    debug("info", "Sync metadata updated in storage", {
      lastSyncAt: syncTimestamp,
      lastSyncCount: candidates.length,
      syncResult,
    });

    const parts: string[] = [];
    if (syncResult.created > 0) parts.push(syncResult.created + " new");
    if (syncResult.alreadyMatched > 0) parts.push(syncResult.alreadyMatched + " auto-matched");
    if (syncResult.existing > 0) parts.push(syncResult.existing + " existing");

    await addLogEntry({
      type: syncResult.created > 0 ? "warning" : "success",
      message: "Synced " + candidates.length + " posts (" + parts.join(", ") + ")",
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    debug("error", "Failed to send candidates", {
      error,
      errorMessage,
      errorStack: error instanceof Error ? error.stack : undefined,
      candidateCount: candidates.length,
    });

    await chrome.storage.local.set({
      lastSyncError: errorMessage,
      lastSyncErrorAt: Date.now(),
      isSyncing: false,
    });

    await addLogEntry({ type: "error", message: "Sync failed: " + errorMessage });
  }
};

const flushBuffer = (): void => {
  debug("info", "Flushing candidate buffer", {
    bufferSize: candidateBuffer.length,
    maxBatchSize: MAX_BATCH_SIZE,
    willSendCount: Math.min(candidateBuffer.length, MAX_BATCH_SIZE),
  });

  if (candidateBuffer.length === 0) {
    debug("info", "Buffer is empty, nothing to flush");
    return;
  }

  const toSend = candidateBuffer.splice(0, MAX_BATCH_SIZE);
  debug("info", "Extracted candidates from buffer", {
    sendingCount: toSend.length,
    remainingInBuffer: candidateBuffer.length,
  });

  sendCandidates(toSend).catch((error) => {
    debug("error", "Error in sendCandidates", error);
  });

  if (candidateBuffer.length > 0) {
    debug("info", "Buffer still has candidates, scheduling next flush", {
      remainingCount: candidateBuffer.length,
      delayMs: BATCH_DELAY_MS,
    });
    batchTimeout = setTimeout(flushBuffer, BATCH_DELAY_MS);
  } else {
    debug("info", "Buffer fully flushed");
    batchTimeout = null;
  }
};

const MAX_RECENT_CANDIDATES = 100;

const storeRecentCandidates = async (candidates: CandidateItem[]): Promise<void> => {
  try {
    debug("info", "Storing recent candidates", {
      candidateCount: candidates.length,
      sampleIds: candidates.slice(0, 3).map((c) => c.fanslyStatisticsId),
    });

    const result = await chrome.storage.local.get(["recentCandidates"]);
    const existing = (result.recentCandidates as CandidateItem[] | undefined) ?? [];

    debug("info", "Retrieved existing candidates from storage", {
      existingCount: existing.length,
      existingIsArray: Array.isArray(existing),
    });

    const seen = new Set<string>(existing.map((c) => c.fanslyStatisticsId));
    const newCandidates = candidates.filter((c) => !seen.has(c.fanslyStatisticsId));

    debug("info", "Filtered new candidates", {
      newCount: newCandidates.length,
      duplicateCount: candidates.length - newCandidates.length,
    });

    const combined = [...newCandidates, ...existing].slice(0, MAX_RECENT_CANDIDATES);

    await chrome.storage.local.set({ recentCandidates: combined });

    debug("info", "Stored recent candidates", {
      newCount: newCandidates.length,
      totalStored: combined.length,
      storageSet: true,
    });
  } catch (error) {
    debug("error", "Failed to store recent candidates", {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });
  }
};

const addToBuffer = (candidates: CandidateItem[]): void => {
  debug("info", "Adding candidates to buffer", {
    newCandidateCount: candidates.length,
    currentBufferSize: candidateBuffer.length,
    newCandidateIds: candidates.map((c) => c.fanslyStatisticsId).slice(0, 5),
    showingFirst: Math.min(5, candidates.length),
  });

  storeRecentCandidates(candidates).catch((error) => {
    debug("error", "Error storing recent candidates", error);
  });

  const seen = new Set<string>();
  const filtered = candidateBuffer.filter((c) => {
    if (seen.has(c.fanslyStatisticsId)) {
      return false;
    }
    seen.add(c.fanslyStatisticsId);
    return true;
  });

  debug("info", "Deduplicating buffer", {
    beforeDedup: candidateBuffer.length,
    afterDedup: filtered.length,
    removedDuplicates: candidateBuffer.length - filtered.length,
  });

  candidateBuffer.length = 0;
  candidateBuffer.push(...filtered);

  // eslint-disable-next-line functional/no-let
  let addedCount = 0;
  candidates.forEach((c) => {
    if (!seen.has(c.fanslyStatisticsId)) {
      candidateBuffer.push(c);
      seen.add(c.fanslyStatisticsId);
      addedCount++;
    }
  });

  debug("info", "Candidates added to buffer", {
    addedCount,
    skippedDuplicates: candidates.length - addedCount,
    newBufferSize: candidateBuffer.length,
    hasPendingTimeout: batchTimeout !== null,
  });

  if (batchTimeout === null) {
    debug("info", "Starting batch timeout", { delayMs: BATCH_DELAY_MS });
    batchTimeout = setTimeout(flushBuffer, BATCH_DELAY_MS);
  }
};

const sendScheduleCapture = async (
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

const processPendingCredentials = async (): Promise<void> => {
  const storage = await chrome.storage.local.get(["pendingCredentials", "lastCredentialsSentAt"]);
  const pending = storage.pendingCredentials;
  const lastSentAt = storage.lastCredentialsSentAt ?? 0;
  const now = Date.now();
  const timeSinceLastSend = now - lastSentAt;

  if (pending && timeSinceLastSend >= CREDENTIALS_THROTTLE_MS) {
    await sendCredentialsToServer(pending);
  }
};

chrome.runtime.onInstalled.addListener(() => {
  debug("info", "Background script installed");
  addLogEntry({ type: "success", message: "Extension started" });
  processPendingCredentials();
});

setInterval(() => {
  processPendingCredentials();
}, CREDENTIALS_THROTTLE_MS);

chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});
