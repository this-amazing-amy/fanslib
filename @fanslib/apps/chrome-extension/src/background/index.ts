import type { CandidateItem } from '../content/fansly-interceptor';

type Message = {
  type: 'FANSLY_TIMELINE_DATA';
  candidates: CandidateItem[];
};

const BATCH_DELAY_MS = 2000;
const MAX_BATCH_SIZE = 50;

const SETTINGS_KEY_API_URL = 'fanslib_api_url';
const DEFAULT_API_URL = 'http://localhost:6970';

const candidateBuffer: CandidateItem[] = [];
// eslint-disable-next-line functional/no-let
let batchTimeout: ReturnType<typeof setTimeout> | null = null;

const DEBUG_PREFIX = '[FansLib:Background]';

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

const getApiUrl = async (): Promise<string | null> => {
  debug('info', 'Fetching API URL from storage');
  const result = await chrome.storage.local.get(SETTINGS_KEY_API_URL);
  const apiUrl = result[SETTINGS_KEY_API_URL] ?? null;
  debug('info', 'API URL retrieved', {
    apiUrl: apiUrl || DEFAULT_API_URL,
    hasApiUrl: !!apiUrl,
    isDefault: !apiUrl,
  });
  return apiUrl || DEFAULT_API_URL;
};

const sendCandidates = async (candidates: CandidateItem[]): Promise<void> => {
  debug('info', 'Starting to send candidates to API', {
    candidateCount: candidates.length,
    candidateIds: candidates.map((c) => c.fanslyStatisticsId).slice(0, 5),
    showingFirst: Math.min(5, candidates.length),
  });

  const apiUrl = await getApiUrl();

  const endpoint = `${apiUrl}/api/analytics/candidates`;
  debug('info', 'Sending POST request to API', {
    endpoint,
    candidateCount: candidates.length,
  });

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items: candidates }),
    });

    debug('info', 'API response received', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    debug('info', 'Candidates sent successfully', {
      sentCount: candidates.length,
      savedCount: result.length,
      result,
    });

    const syncTimestamp = Date.now();
    await chrome.storage.local.set({
      lastSyncAt: syncTimestamp,
      lastSyncCount: candidates.length,
      lastSyncError: null,
      lastSyncErrorAt: null,
    });

    debug('info', 'Sync metadata updated in storage', {
      lastSyncAt: syncTimestamp,
      lastSyncCount: candidates.length,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    debug('error', 'Failed to send candidates', {
      error,
      errorMessage,
      errorStack: error instanceof Error ? error.stack : undefined,
      candidateCount: candidates.length,
    });

    await chrome.storage.local.set({
      lastSyncError: errorMessage,
      lastSyncErrorAt: Date.now(),
    });
  }
};

const flushBuffer = (): void => {
  debug('info', 'Flushing candidate buffer', {
    bufferSize: candidateBuffer.length,
    maxBatchSize: MAX_BATCH_SIZE,
    willSendCount: Math.min(candidateBuffer.length, MAX_BATCH_SIZE),
  });

  if (candidateBuffer.length === 0) {
    debug('info', 'Buffer is empty, nothing to flush');
    return;
  }

  const toSend = candidateBuffer.splice(0, MAX_BATCH_SIZE);
  debug('info', 'Extracted candidates from buffer', {
    sendingCount: toSend.length,
    remainingInBuffer: candidateBuffer.length,
  });

  sendCandidates(toSend).catch((error) => {
    debug('error', 'Error in sendCandidates', error);
  });

  if (candidateBuffer.length > 0) {
    debug('info', 'Buffer still has candidates, scheduling next flush', {
      remainingCount: candidateBuffer.length,
      delayMs: BATCH_DELAY_MS,
    });
    batchTimeout = setTimeout(flushBuffer, BATCH_DELAY_MS);
  } else {
    debug('info', 'Buffer fully flushed');
    batchTimeout = null;
  }
};

const addToBuffer = (candidates: CandidateItem[]): void => {
  debug('info', 'Adding candidates to buffer', {
    newCandidateCount: candidates.length,
    currentBufferSize: candidateBuffer.length,
    newCandidateIds: candidates.map((c) => c.fanslyStatisticsId).slice(0, 5),
    showingFirst: Math.min(5, candidates.length),
  });

  const seen = new Set<string>();
  const filtered = candidateBuffer.filter((c) => {
    if (seen.has(c.fanslyStatisticsId)) {
      return false;
    }
    seen.add(c.fanslyStatisticsId);
    return true;
  });

  debug('info', 'Deduplicating buffer', {
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

  debug('info', 'Candidates added to buffer', {
    addedCount,
    skippedDuplicates: candidates.length - addedCount,
    newBufferSize: candidateBuffer.length,
    hasPendingTimeout: batchTimeout !== null,
  });

  if (batchTimeout === null) {
    debug('info', 'Starting batch timeout', { delayMs: BATCH_DELAY_MS });
    batchTimeout = setTimeout(flushBuffer, BATCH_DELAY_MS);
  }
};

chrome.runtime.onMessage.addListener((message: Message) => {
  debug('info', 'Received message', {
    type: message.type,
    hasCandidates: !!message.candidates,
    candidateCount: message.candidates?.length,
  });

  if (message.type === 'FANSLY_TIMELINE_DATA') {
    addToBuffer(message.candidates);
  }
});

chrome.runtime.onInstalled.addListener(() => {
  debug('info', 'Background script installed');
});
