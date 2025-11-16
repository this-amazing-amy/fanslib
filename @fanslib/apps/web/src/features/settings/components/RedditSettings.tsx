import { SettingRow } from "./SettingRow";

export const RedditSettings = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-lg font-medium">Reddit Integration</h2>
      <p className="text-sm text-base-content/60">
        Manage Reddit authentication for automated posting via the server
      </p>
    </div>

    <div className="space-y-4">
      <SettingRow
        title="Reddit Authentication"
        description="Reddit integration settings will be available in a future update"
      >
        <div className="text-sm text-base-content/60">Coming soon...</div>
      </SettingRow>
    </div>
  </div>
);
