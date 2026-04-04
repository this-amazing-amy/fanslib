import { mkdir } from "fs/promises";
import { dirname, join } from "path";
import type { Settings } from "../../schemas/settings";
import { appdataPath } from "../../../../lib/env";

export const DEFAULT_SETTINGS: Settings = {
  theme: "dark",
  blueskyUsername: "",
  blueskyAppPassword: "",
  postponeToken: "",
  blueskyDefaultExpiryDays: 7,
  sfwMode: false,
  sfwBlurIntensity: 5,
  sfwDefaultMode: "off",
  sfwHoverDelay: 300,
  backgroundJobsServerUrl: "",
  repostSettings: {
    useAnalytics: false,
    plateauConsecutiveDays: 5,
    plateauThresholdPercent: 1.5,
    minDatapointsForPlateau: 7,
    defaultMediaRepostCooldownHours: 504, // 21 days
  },
  captionStylePresets: [],
};

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
