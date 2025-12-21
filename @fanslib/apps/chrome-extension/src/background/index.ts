import type { CandidateItem } from '../content/fansly-interceptor';

type Message = {
  type: 'FANSLY_TIMELINE_DATA';
  candidates: CandidateItem[];
};

const BATCH_DELAY_MS = 2000;
const MAX_BATCH_SIZE = 50;

const candidateBuffer: CandidateItem[] = [];
// eslint-disable-next-line functional/no-let
let batchTimeout: ReturnType<typeof setTimeout> | null = null;

const getApiUrl = async (): Promise<string | null> => {
  const result = await chrome.storage.local.get('apiUrl');
  return result.apiUrl ?? null;
};

const sendCandidates = async (candidates: CandidateItem[]): Promise<void> => {
  const apiUrl = await getApiUrl();
  if (!apiUrl) {
    console.warn('[FansLib] API URL not configured');
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/api/analytics/candidates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items: candidates }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(
      `[FansLib] Sent ${candidates.length} candidates, received ${result.length} saved`
    );

    await chrome.storage.local.set({
      lastSyncAt: Date.now(),
      lastSyncCount: candidates.length,
    });
  } catch (error) {
    console.error('[FansLib] Failed to send candidates:', error);
  }
};

const flushBuffer = (): void => {
  if (candidateBuffer.length === 0) return;

  const toSend = candidateBuffer.splice(0, MAX_BATCH_SIZE);
  sendCandidates(toSend).catch(console.error);

  if (candidateBuffer.length > 0) {
    batchTimeout = setTimeout(flushBuffer, BATCH_DELAY_MS);
  } else {
    batchTimeout = null;
  }
};

const addToBuffer = (candidates: CandidateItem[]): void => {
  const seen = new Set<string>();
  const filtered = candidateBuffer.filter((c) => {
    if (seen.has(c.fanslyStatisticsId)) {
      return false;
    }
    seen.add(c.fanslyStatisticsId);
    return true;
  });
  candidateBuffer.length = 0;
  candidateBuffer.push(...filtered);

  candidates.forEach((c) => {
    if (!seen.has(c.fanslyStatisticsId)) {
      candidateBuffer.push(c);
      seen.add(c.fanslyStatisticsId);
    }
  });

  batchTimeout ??= setTimeout(flushBuffer, BATCH_DELAY_MS);
};

chrome.runtime.onMessage.addListener((message: Message) => {
  if (message.type === 'FANSLY_TIMELINE_DATA') {
    addToBuffer(message.candidates);
  }
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('[FansLib] Background script installed');
});
