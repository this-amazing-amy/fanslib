import { t } from "elysia";
import { loadSettings } from "./load";
import { saveSettings } from "./save";

export const ToggleSfwModeResponseSchema = t.Object({
  success: t.Boolean(),
});

export const toggleSfwMode = async (): Promise<typeof ToggleSfwModeResponseSchema.static> => {
  const currentSettings = await loadSettings();
  await saveSettings({ sfwMode: !currentSettings.sfwMode });
  return { success: true };
};

