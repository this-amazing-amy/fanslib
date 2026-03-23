import { addLogEntry } from "../lib/activity-log";
import type { CandidateItem } from "../content/fansly-interceptor";
import { debug, getApiUrl } from "./config";
import { eden } from "../lib/api";

const BATCH_DELAY_MS = 2000;
const MAX_BATCH_SIZE = 50;
const MAX_RECENT_CANDIDATES = 100;

const candidateBuffer: CandidateItem[] = [];
// eslint-disable-next-line functional/no-let
let batchTimeout: ReturnType<typeof setTimeout> | null = null;

type SyncResult = {
  created: number;
  existing: number;
  alreadyMatched: number;
};

export const sendCandidates = async (candidates: CandidateItem[]): Promise<void> => {
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

export const storeRecentCandidates = async (candidates: CandidateItem[]): Promise<void> => {
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

export const addToBuffer = (candidates: CandidateItem[]): void => {
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
