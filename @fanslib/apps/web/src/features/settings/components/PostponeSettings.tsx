import { Input } from "~/components/ui/Input";
import { useSaveSettingsMutation, useSettingsQuery } from "~/lib/queries/settings";
import { SettingRow } from "./SettingRow";

export const PostponeSettings = () => {
  const { data: settings } = useSettingsQuery();
  const saveSettings = useSaveSettingsMutation();

  const updateBlueskyUsername = (username: string) => {
    saveSettings.mutate({ blueskyUsername: username });
  };

  const updatePostponeToken = (token: string) => {
    saveSettings.mutate({ postponeToken: token });
  };

  const updateBlueskyDefaultExpiryDays = (days: string) => {
    const numDays = parseInt(days, 10);
    saveSettings.mutate({ blueskyDefaultExpiryDays: isNaN(numDays) ? undefined : numDays });
  };

  return (
    <div className="space-y-4">
      <SettingRow
        title="Postpone Token"
        description="Enter your Postpone API token to enable content scheduling integration"
      >
        <Input
          type="password"
          id="postpone-token"
          placeholder="Enter your Postpone API token"
          value={settings?.postponeToken ?? ""}
          onChange={(value) => updatePostponeToken(value)}
          className="max-w-sm"
        />
      </SettingRow>

      <SettingRow
        title="Bluesky Username"
        description="Your Bluesky handle for cross-platform posting"
      >
        <Input
          type="text"
          id="bluesky-username"
          placeholder="your.handle"
          value={settings?.blueskyUsername ?? ""}
          onChange={(value) => updateBlueskyUsername(value)}
          className="max-w-sm"
        />
      </SettingRow>

      <SettingRow
        title="Bluesky Default Expiry"
        description="Number of days after which Bluesky posts sent to Postpone will be automatically removed (1-365 days)"
      >
        <Input
          type="number"
          id="bluesky-default-expiry-days"
          placeholder="7"
          min={1}
          max={365}
          value={(settings?.blueskyDefaultExpiryDays ?? 7).toString()}
          onChange={(value) => updateBlueskyDefaultExpiryDays(value)}
          className="max-w-24"
        />
      </SettingRow>
    </div>
  );
};
