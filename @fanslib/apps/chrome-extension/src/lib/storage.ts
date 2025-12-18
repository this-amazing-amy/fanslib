// Settings storage keys
export const SETTINGS_KEYS = {
  libraryPath: 'fanslib_library_path',
  apiUrl: 'fanslib_api_url',
  webUrl: 'fanslib_web_url',
  bridgeUrl: 'fanslib_bridge_url',
} as const;

export const DEFAULT_API_URL = 'http://localhost:6970';
export const DEFAULT_WEB_URL = 'http://localhost:6969';
export const DEFAULT_BRIDGE_URL = 'http://localhost:6971';
export const FANSLY_HOME_URL = 'https://fansly.com/home';

// Settings type
export type Settings = {
  libraryPath: string;
  apiUrl: string;
  webUrl: string;
  bridgeUrl: string;
};

// Get settings from Chrome storage
export const getSettings = async (): Promise<Settings> => {
  const result = await chrome.storage.local.get([
    SETTINGS_KEYS.libraryPath,
    SETTINGS_KEYS.apiUrl,
    SETTINGS_KEYS.webUrl,
    SETTINGS_KEYS.bridgeUrl,
  ]);

  return {
    libraryPath: result[SETTINGS_KEYS.libraryPath] ?? '',
    apiUrl: result[SETTINGS_KEYS.apiUrl] ?? DEFAULT_API_URL,
    webUrl: result[SETTINGS_KEYS.webUrl] ?? DEFAULT_WEB_URL,
    bridgeUrl: result[SETTINGS_KEYS.bridgeUrl] ?? DEFAULT_BRIDGE_URL,
  };
};

// Save settings to Chrome storage
export const saveSettings = async (settings: Partial<Settings>) => {
  await chrome.storage.local.set({
    ...(settings.libraryPath !== undefined && {
      [SETTINGS_KEYS.libraryPath]: settings.libraryPath,
    }),
    ...(settings.apiUrl !== undefined && {
      [SETTINGS_KEYS.apiUrl]: settings.apiUrl,
    }),
    ...(settings.webUrl !== undefined && {
      [SETTINGS_KEYS.webUrl]: settings.webUrl,
    }),
    ...(settings.bridgeUrl !== undefined && {
      [SETTINGS_KEYS.bridgeUrl]: settings.bridgeUrl,
    }),
  });
};
