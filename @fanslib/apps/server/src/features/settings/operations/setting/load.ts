import type { Settings } from "@fanslib/types";
import { readFile } from "fs/promises";
import { DEFAULT_SETTINGS, ensureSettingsFile, settingsFilePath } from "./helpers";

export const loadSettings = async (): Promise<Settings> => {
  try {
    await ensureSettingsFile();
    const data = await readFile(settingsFilePath(), "utf8");
    return JSON.parse(data) as Settings;
  } catch (error) {
    console.error("Error loading settings:", error);
    return DEFAULT_SETTINGS;
  }
};

