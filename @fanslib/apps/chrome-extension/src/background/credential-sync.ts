import { addLogEntry } from "../lib/activity-log";
import { eden } from "../lib/api";
import { getApiUrl } from "./config";

export const CREDENTIALS_THROTTLE_MS = 60000;

export const sendCredentialsToServer = async (credentials: {
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

export const processPendingCredentials = async (): Promise<void> => {
  const storage = await chrome.storage.local.get(["pendingCredentials", "lastCredentialsSentAt"]);
  const pending = storage.pendingCredentials;
  const lastSentAt = storage.lastCredentialsSentAt ?? 0;
  const now = Date.now();
  const timeSinceLastSend = now - lastSentAt;

  if (pending && timeSinceLastSend >= CREDENTIALS_THROTTLE_MS) {
    await sendCredentialsToServer(pending);
  }
};
