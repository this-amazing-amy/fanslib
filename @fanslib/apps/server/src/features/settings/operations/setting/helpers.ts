import type { Settings } from "@fanslib/types";
import { mkdir } from "fs/promises";
import { dirname, join } from "path";

export const DEFAULT_SETTINGS: Settings = {
  theme: "dark",
  libraryPath: "",
  blueskyUsername: "",
  postponeToken: "",
  blueskyDefaultExpiryDays: 7,
  sfwMode: false,
  sfwBlurIntensity: 5,
  sfwDefaultMode: "off",
  sfwHoverDelay: 300,
  backgroundJobsServerUrl: "",
};

import { appdataPath } from "../../../../lib/env";

export const settingsFilePath = (): string => join(appdataPath(), "settings.json");

export const ensureSettingsFile = async (): Promise<void> => {
  const { access, writeFile } = await import("fs/promises");
  try {
    await access(settingsFilePath());
  } catch {
    await mkdir(dirname(settingsFilePath()), { recursive: true });
    await writeFile(settingsFilePath(), JSON.stringify(DEFAULT_SETTINGS, null, 2));
  }
};

