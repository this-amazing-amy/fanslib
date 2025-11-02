import { loadSettings } from "./load";
import { saveSettings } from "./save";

export const toggleSfwMode = async (): Promise<Awaited<ReturnType<typeof loadSettings>>> => {
  const currentSettings = await loadSettings();
  return saveSettings({ sfwMode: !currentSettings.sfwMode });
};

