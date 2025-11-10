
import { readFile } from "fs/promises";
import { SettingsSchema } from "../../schemas/settings";
import { DEFAULT_SETTINGS, ensureSettingsFile, settingsFilePath } from "./helpers";

export const LoadSettingsResponseSchema = SettingsSchema

export const loadSettings = async (): Promise<typeof LoadSettingsResponseSchema.static> => {
  try {
    await ensureSettingsFile();
    const data = await readFile(settingsFilePath(), "utf8");
    return JSON.parse(data) as typeof SettingsSchema.static;
  } catch (error) {
    console.error("Error loading settings:", error);
    return DEFAULT_SETTINGS;
  }
};

