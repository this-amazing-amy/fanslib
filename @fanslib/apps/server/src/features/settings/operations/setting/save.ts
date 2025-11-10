import { t } from "elysia";
import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname } from "path";
import { SettingsSchema } from "../../schemas/settings";
import { DEFAULT_SETTINGS, settingsFilePath } from "./helpers";

export const SaveSettingsRequestBodySchema = t.Partial(SettingsSchema);
export const SaveSettingsResponseSchema = SettingsSchema;

export const saveSettings = async (partialSettings: Partial<typeof SettingsSchema.static>): Promise<typeof SaveSettingsResponseSchema.static> => {
  try {
    await mkdir(dirname(settingsFilePath()), { recursive: true });

    const currentSettings = await readFile(settingsFilePath(), "utf8")
      .then((data) => JSON.parse(data) as typeof SettingsSchema.static)
      .catch(() => DEFAULT_SETTINGS);

    const newSettings = { ...currentSettings, ...partialSettings };
    await writeFile(settingsFilePath(), JSON.stringify(newSettings, null, 2));
    return newSettings;
  } catch (error) {
    console.error("Error saving settings:", error);
    throw error;
  }
};

