import { t } from "elysia";
import { loadSettings } from "./load";
import { saveSettings } from "./save";

export const ToggleSfwModeResponseSchema = t.Object({
  sfwMode: t.Boolean(),
});

export const toggleSfwMode = async (): Promise<typeof ToggleSfwModeResponseSchema.static> => {
  const currentSettings = await loadSettings();
  const saved = await saveSettings({ sfwMode: !currentSettings.sfwMode });
  return { sfwMode: saved.sfwMode };
};

