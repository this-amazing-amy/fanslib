import { useState } from "react";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { useSaveSettingsMutation, useSettingsQuery, useTestBlueskyCredentialsMutation } from "~/lib/queries/settings";
import { SettingRow } from "./SettingRow";

export const BlueskySettings = () => {
  const { data: settings } = useSettingsQuery();
  const saveSettings = useSaveSettingsMutation();
  const testCredentials = useTestBlueskyCredentialsMutation();
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);

  const updateBlueskyUsername = (username: string) => {
    saveSettings.mutate({ blueskyUsername: username });
  };

  const updateBlueskyAppPassword = (password: string) => {
    saveSettings.mutate({ blueskyAppPassword: password });
  };

  const updateBlueskyDefaultExpiryDays = (days: string) => {
    const numDays = parseInt(days, 10);
    saveSettings.mutate({ blueskyDefaultExpiryDays: isNaN(numDays) ? undefined : numDays });
  };

  const testCredentialsHandler = async () => {
    setTestResult(null);
    try {
      const result = await testCredentials.mutateAsync();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  return (
    <div className="space-y-4">
      <SettingRow
        title="Bluesky Handle"
        description="Your Bluesky handle (e.g., yourname.bsky.social)"
      >
        <Input
          type="text"
          id="bluesky-username"
          placeholder="yourname.bsky.social"
          value={settings?.blueskyUsername ?? ""}
          onChange={(value) => updateBlueskyUsername(value)}
          className="max-w-sm"
        />
      </SettingRow>

      <SettingRow
        title="Bluesky App Password"
        description="App password for Bluesky API access. Generate one in Bluesky Settings > Privacy & Security > App Passwords"
      >
        <div className="flex flex-col gap-2">
          <Input
            type="password"
            id="bluesky-app-password"
            placeholder="xxxx-xxxx-xxxx-xxxx"
            value={settings?.blueskyAppPassword ?? ""}
            onChange={(value) => updateBlueskyAppPassword(value)}
            className="max-w-sm"
          />
          <Button
            onClick={testCredentialsHandler}
            isDisabled={testCredentials.isPending || !settings?.blueskyUsername || !settings?.blueskyAppPassword}
            isLoading={testCredentials.isPending}
            variant="secondary"
            className="w-fit"
          >
            Test Credentials
          </Button>
          {testResult && (
            <div className={`text-sm ${testResult.success ? "text-green-600" : "text-red-600"}`}>
              {testResult.success ? "✓ Credentials are valid" : `✗ ${testResult.error ?? "Invalid credentials"}`}
            </div>
          )}
        </div>
      </SettingRow>

      <SettingRow
        title="Bluesky Default Expiry"
        description="Number of days after which Bluesky posts will be automatically removed (1-365 days)"
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
