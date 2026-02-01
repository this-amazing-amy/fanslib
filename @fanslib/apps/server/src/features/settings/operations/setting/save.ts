import type { z } from "zod";
import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname } from "path";
import { SettingsSchema } from "../../schemas/settings";
import { DEFAULT_SETTINGS, settingsFilePath } from "./helpers";

export const SaveSettingsRequestBodySchema = SettingsSchema.partial();
export const SaveSettingsResponseSchema = SettingsSchema;

export type SaveSettingsRequestBody = z.infer<typeof SaveSettingsRequestBodySchema>;
export type SaveSettingsResponse = z.infer<typeof SaveSettingsResponseSchema>;

export const saveSettings = async (partialSettings: SaveSettingsRequestBody): Promise<SaveSettingsResponse> => {
  try {
    await mkdir(dirname(settingsFilePath()), { recursive: true });

    const currentSettings = await readFile(settingsFilePath(), "utf8")
      .then((data) => JSON.parse(data) as SaveSettingsResponse)
      .catch(() => DEFAULT_SETTINGS);

    const newSettings = { ...currentSettings, ...partialSettings };
    await writeFile(settingsFilePath(), JSON.stringify(newSettings, null, 2));
    return newSettings;
  } catch (error) {
    console.error("Error saving settings:", error);
    throw error;
  }
};

