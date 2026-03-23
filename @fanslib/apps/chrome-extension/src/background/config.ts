export const SETTINGS_KEY_API_URL = "fanslib_api_url";
export const DEFAULT_API_URL = "http://localhost:6970";

const DEBUG_PREFIX = "[FansLib:Background]";

export const debug = (level: "info" | "warn" | "error", message: string, data?: unknown) => {
  const timestamp = new Date().toISOString();
  const logArgs =
    data !== undefined
      ? [`[${timestamp}] ${DEBUG_PREFIX} ${message}`, data]
      : [`[${timestamp}] ${DEBUG_PREFIX} ${message}`];

  switch (level) {
    case "info":
      console.log(...logArgs);
      break;
    case "warn":
      console.warn(...logArgs);
      break;
    case "error":
      console.error(...logArgs);
      break;
  }
};

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

