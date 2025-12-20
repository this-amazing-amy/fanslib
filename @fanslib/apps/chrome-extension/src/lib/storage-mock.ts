// Mock storage implementation using localStorage instead of chrome.storage
// This allows testing the extension functionality without loading it as an extension

import type { Settings } from './storage';
import {
  DEFAULT_API_URL,
  DEFAULT_BRIDGE_URL,
  DEFAULT_WEB_URL,
  SETTINGS_KEYS,
} from './storage';

// Get settings from localStorage (mimics chrome.storage.local.get)
export const getSettings = async (): Promise<Settings> => ({
  libraryPath: localStorage.getItem(SETTINGS_KEYS.libraryPath) ?? '',
  apiUrl: localStorage.getItem(SETTINGS_KEYS.apiUrl) ?? DEFAULT_API_URL,
  webUrl: localStorage.getItem(SETTINGS_KEYS.webUrl) ?? DEFAULT_WEB_URL,
  bridgeUrl:
    localStorage.getItem(SETTINGS_KEYS.bridgeUrl) ?? DEFAULT_BRIDGE_URL,
});

// Save settings to localStorage (mimics chrome.storage.local.set)
export const saveSettings = async (settings: Partial<Settings>) => {
  if (settings.libraryPath !== undefined) {
    localStorage.setItem(SETTINGS_KEYS.libraryPath, settings.libraryPath);
  }
  if (settings.apiUrl !== undefined) {
    localStorage.setItem(SETTINGS_KEYS.apiUrl, settings.apiUrl);
  }
  if (settings.webUrl !== undefined) {
    localStorage.setItem(SETTINGS_KEYS.webUrl, settings.webUrl);
  }
  if (settings.bridgeUrl !== undefined) {
    localStorage.setItem(SETTINGS_KEYS.bridgeUrl, settings.bridgeUrl);
  }
};
