import { z } from "zod";
import { readFile } from "fs/promises";
import { env } from "../../../../lib/env";
import { SettingsSchema } from "../../schemas/settings";
import { DEFAULT_SETTINGS, ensureSettingsFile, settingsFilePath } from "./helpers";

export const LoadSettingsResponseSchema = SettingsSchema;

export type LoadSettingsResponse = z.infer<typeof LoadSettingsResponseSchema>;

export const loadSettings = async (): Promise<LoadSettingsResponse> => {
  try {
    await ensureSettingsFile();
    const data = await readFile(settingsFilePath(), "utf8");
    const settings = JSON.parse(data) as LoadSettingsResponse;
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

