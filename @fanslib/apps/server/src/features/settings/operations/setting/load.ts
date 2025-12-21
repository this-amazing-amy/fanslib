
import { readFile } from "fs/promises";
import { env } from "../../../../lib/env";
import { SettingsSchema } from "../../schemas/settings";
import { DEFAULT_SETTINGS, ensureSettingsFile, settingsFilePath } from "./helpers";

export const LoadSettingsResponseSchema = SettingsSchema

export const loadSettings = async (): Promise<typeof LoadSettingsResponseSchema.static> => {
  try {
    await ensureSettingsFile();
    const data = await readFile(settingsFilePath(), "utf8");
    const settings = JSON.parse(data) as typeof SettingsSchema.static;
    // Include libraryPath from environment (read-only)
    return {
      ...settings,
      libraryPath: env().libraryPath,
    };
  } catch (error) {
    console.error("Error loading settings:", error);
    return {
      ...DEFAULT_SETTINGS,
      libraryPath: env().libraryPath,
    };
  }
};

