import { debug } from "./debug-log";

// Buffer for contentId from account/media creation — Fansly splits
// media creation and post creation into separate API calls.
export const ACCOUNT_MEDIA_BUFFER_TTL_MS = 30_000;

// eslint-disable-next-line functional/no-let
let bufferedAccountMediaId: { contentId: string; timestamp: number } | null = null;

export const bufferAccountMediaId = (contentId: string) => {
  bufferedAccountMediaId = { contentId, timestamp: Date.now() };
  debug("info", "Buffered account media contentId for upcoming post", {
    contentId,
    ttlMs: ACCOUNT_MEDIA_BUFFER_TTL_MS,
  });
};

export const consumeBufferedAccountMediaId = (): string | null => {
  if (!bufferedAccountMediaId) return null;
  const age = Date.now() - bufferedAccountMediaId.timestamp;
  if (age > ACCOUNT_MEDIA_BUFFER_TTL_MS) {
    debug("warn", "Buffered account media contentId expired", {
      contentId: bufferedAccountMediaId.contentId,
      ageMs: age,
    });
    bufferedAccountMediaId = null;
    return null;
  }
  const { contentId } = bufferedAccountMediaId;
  bufferedAccountMediaId = null;
  debug("info", "Consumed buffered account media contentId", { contentId, ageMs: age });
  return contentId;
};
