import { z } from "zod";
import { loadSettings } from "./load";
import { saveSettings } from "./save";

export const ToggleSfwModeResponseSchema = z.object({
  sfwMode: z.boolean(),
});

export type ToggleSfwModeResponse = z.infer<typeof ToggleSfwModeResponseSchema>;

export const toggleSfwMode = async (): Promise<ToggleSfwModeResponse> => {
  const currentSettings = await loadSettings();
  const saved = await saveSettings({ sfwMode: !currentSettings.sfwMode });
  return { sfwMode: saved.sfwMode };
};

