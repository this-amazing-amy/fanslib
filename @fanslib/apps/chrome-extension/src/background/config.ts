export const SETTINGS_KEY_API_URL = "fanslib_api_url";
export const DEFAULT_API_URL = "http://localhost:6970";

import { createDebugLogger } from "../lib/debug";

export const debug = createDebugLogger("[FansLib:Background]");

export const getApiUrl = async (): Promise<string | null> => {
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
