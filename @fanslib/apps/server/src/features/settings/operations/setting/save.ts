import type { Settings } from "@fanslib/types";
import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname } from "path";
import { DEFAULT_SETTINGS, settingsFilePath } from "./helpers";

export const saveSettings = async (partialSettings: Partial<Settings>): Promise<Settings> => {
  try {
    await mkdir(dirname(settingsFilePath()), { recursive: true });

    const currentSettings = await readFile(settingsFilePath(), "utf8")
      .then((data) => JSON.parse(data) as Settings)
      .catch(() => DEFAULT_SETTINGS);

    const newSettings = { ...currentSettings, ...partialSettings };
    await writeFile(settingsFilePath(), JSON.stringify(newSettings, null, 2));
    return newSettings;
  } catch (error) {
    console.error("Error saving settings:", error);
    throw error;
  }
};

