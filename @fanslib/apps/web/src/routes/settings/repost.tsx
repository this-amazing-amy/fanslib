import { createFileRoute } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { Input } from "~/components/ui/Input";
import { Switch } from "~/components/ui/Switch";
import { SettingRow } from "~/features/settings/components/SettingRow";
import { useSaveSettingsMutation, useSettingsQuery } from "~/lib/queries/settings";

const RepostSettings = () => {
  const { data: settings } = useSettingsQuery();
  const { mutate: saveSettings } = useSaveSettingsMutation();

  const repostSettings = settings?.repostSettings ?? {
    useAnalytics: false,
    plateauConsecutiveDays: 5,
    plateauThresholdPercent: 1.5,
    minDatapointsForPlateau: 7,
    defaultMediaRepostCooldownHours: 504,
  };

  const updateRepostSetting = (key: string, value: number | boolean) => {
    saveSettings({
      repostSettings: {
        ...repostSettings,
        [key]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <RefreshCw /> Repost Settings
        </h1>
        <p className="text-base-content/60">
          Configure cooldown periods and plateau detection for content reposting
        </p>
      </div>

      <div className="space-y-2">
        <SettingRow
          title="Default Cooldown"
          description="Hours before media can be reposted (when no channel-specific cooldown is set). 504 hours = 21 days."
        >
          <Input
            type="number"
            value={String(repostSettings.defaultMediaRepostCooldownHours)}
            onChange={(val) => updateRepostSetting("defaultMediaRepostCooldownHours", parseInt(val, 10) || 504)}
            min={0}
            aria-label="Default cooldown hours"
          />
        </SettingRow>

        <SettingRow
          title="Use Analytics"
          description="Enable plateau detection to determine if a post is still growing before marking it as repostable."
        >
          <Switch
            isSelected={repostSettings.useAnalytics}
            onChange={(val) => updateRepostSetting("useAnalytics", val)}
          />
        </SettingRow>

        {repostSettings.useAnalytics && (
          <>
            <SettingRow
              title="Plateau Consecutive Days"
              description="Number of consecutive low-growth days required to detect a plateau."
              variant="secondary"
            >
              <Input
                type="number"
                value={String(repostSettings.plateauConsecutiveDays)}
                onChange={(val) => updateRepostSetting("plateauConsecutiveDays", parseInt(val, 10) || 5)}
                min={1}
                aria-label="Plateau consecutive days"
              />
            </SettingRow>

            <SettingRow
              title="Plateau Threshold %"
              description="Maximum daily view growth percentage to be considered a plateau."
              variant="secondary"
            >
              <Input
                type="number"
                value={String(repostSettings.plateauThresholdPercent)}
                onChange={(val) => updateRepostSetting("plateauThresholdPercent", parseFloat(val) || 1.5)}
                min={0}
                step={0.1}
                aria-label="Plateau threshold percent"
              />
            </SettingRow>

            <SettingRow
              title="Min Datapoints for Plateau"
              description="Minimum number of analytics datapoints required before plateau detection kicks in."
              variant="secondary"
            >
              <Input
                type="number"
                value={String(repostSettings.minDatapointsForPlateau)}
                onChange={(val) => updateRepostSetting("minDatapointsForPlateau", parseInt(val, 10) || 7)}
                min={3}
                aria-label="Minimum datapoints for plateau"
              />
            </SettingRow>
          </>
        )}
      </div>
    </div>
  );
};

export const Route = createFileRoute("/settings/repost")({
  component: RepostSettings,
});
