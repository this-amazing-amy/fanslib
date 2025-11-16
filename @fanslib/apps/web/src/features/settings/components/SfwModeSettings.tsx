import { useState } from "react";
import { Card } from "~/components/ui/Card";
import { RadioGroup, RadioGroupItem } from "~/components/ui/RadioGroup";
import { Slider } from "~/components/ui/Slider";
import { Switch } from "~/components/ui/Switch";
import { useSfwMode } from "~/hooks/useSfwMode";
import { cn } from "~/lib/cn";
import { useSaveSettingsMutation, useSettingsQuery, useToggleSfwModeMutation } from "~/lib/queries/settings";
import { SettingRow } from "./SettingRow";

export const SfwModeSettings = () => {
  const { data: settings } = useSettingsQuery();
  const saveSettings = useSaveSettingsMutation();
  const toggleSfwMode = useToggleSfwModeMutation();
  const [previewBlur, setPreviewBlur] = useState(() => settings?.sfwBlurIntensity ?? 5);
  const { handleMouseEnter, handleMouseLeave, getBlurClassName } = useSfwMode();

  if (!settings) return null;

  const handleBlurIntensityChange = (values: number | number[]) => {
    const intensity = Array.isArray(values) ? values[0] ?? 5 : values ?? 5;
    setPreviewBlur(intensity);
    saveSettings.mutate({ sfwBlurIntensity: intensity });
  };

  const handleHoverDelayChange = (value: string) => {
    const delay = parseInt(value) || 0;
    saveSettings.mutate({ sfwHoverDelay: delay });
  };

  const handleDefaultModeChange = (value: string) => {
    saveSettings.mutate({ sfwDefaultMode: value as "off" | "on" | "remember" });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <SettingRow
          title="Enable SFW Mode"
          description="Blur all media content throughout the application"
          descriptionSlot={
            <p className="text-sm text-base-content/60">
              Use <strong>Cmd/Ctrl + Shift + S</strong> to toggle quickly.
            </p>
          }
        >
          <Switch id="sfw-mode" isSelected={settings.sfwMode} onChange={() => toggleSfwMode.mutate()} />
        </SettingRow>

        <SettingRow
          title="Blur Intensity"
          description="Adjust how much content is blurred (1 = light, 10 = heavy)"
          variant="secondary"
        >
          <div className="space-y-2 w-full">
            <Slider
              value={[previewBlur]}
              onChange={handleBlurIntensityChange}
              maxValue={10}
              minValue={1}
              step={1}
              className="w-full"
            />
            <div className="text-sm text-base-content/60">Current: {previewBlur}</div>
          </div>
        </SettingRow>

        <SettingRow
          title="Hover Delay"
          variant="secondary"
          description="How long to wait before revealing content on hover (0 = instant)"
        >
          <input
            id="hover-delay"
            type="number"
            value={settings.sfwHoverDelay.toString()}
            onChange={(e) => handleHoverDelayChange(e.target.value)}
            min={0}
            max={2000}
            step={50}
            className="input input-bordered w-24"
            placeholder="ms"
          />
        </SettingRow>

        <SettingRow
          title="Live Preview"
          variant="secondary"
          description={`Preview of blur effect at current intensity. ${
            settings.sfwMode ? "Hover to test delay setting." : "Enable SFW mode to see effect."
          }`}
        >
          <Card className="p-4 overflow-hidden w-full max-w-sm">
            <div className="relative">
              <div
                className={cn(
                  "w-full h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-md cursor-pointer",
                  settings.sfwMode ? getBlurClassName() : ""
                )}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-white font-medium">Sample Content</span>
              </div>
            </div>
          </Card>
        </SettingRow>

        <SettingRow
          title="Default Behavior"
          variant="secondary"
          description="How SFW mode should behave when the application starts"
        >
          <RadioGroup
            value={settings.sfwDefaultMode}
            onChange={handleDefaultModeChange}
            className="grid grid-cols-1 gap-2"
          >
            <RadioGroupItem value="off" id="default-off">
              Always start with SFW mode OFF
            </RadioGroupItem>
            <RadioGroupItem value="on" id="default-on">
              Always start with SFW mode ON
            </RadioGroupItem>
            <RadioGroupItem value="remember" id="default-remember">
              Remember last setting
            </RadioGroupItem>
          </RadioGroup>
        </SettingRow>
      </div>
    </div>
  );
};
