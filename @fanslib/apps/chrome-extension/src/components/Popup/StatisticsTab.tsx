import { useEffect, useState } from "react";
import { eden } from "../../lib/api";
import { getSettings } from "../../lib/storage";

type SyncStatus = {
  lastSyncAt: number | null;
  lastSyncCount: number | null;
  pendingCount: number;
};

export const StatisticsTab = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSyncAt: null,
    lastSyncCount: null,
    pendingCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [webUrl, setWebUrl] = useState<string | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const settings = await getSettings();
      setWebUrl(settings.webUrl);

      const storage = await chrome.storage.local.get(["lastSyncAt", "lastSyncCount"]);
      setSyncStatus((prev) => ({
        ...prev,
        lastSyncAt: storage.lastSyncAt ?? null,
        lastSyncCount: storage.lastSyncCount ?? null,
      }));

      const api = eden(settings.apiUrl);
      const response = await api.api.analytics.candidates.get({
        query: { status: "pending", limit: 1 },
      });

      if (!response.error && response.data) {
        setSyncStatus((prev) => ({
          ...prev,
          pendingCount: response.data.total ?? 0,
        }));
      }
    } catch (error) {
      console.error("Failed to load sync status:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatLastSync = (timestamp: number | null): string => {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  };

  const openMatchingPage = () => {
    if (webUrl) {
      chrome.tabs.create({ url: `${webUrl}/analytics/matching` });
    }
  };

  return (
    <div className="px-3 pt-3 pb-4">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold mb-2">Sync Status</h3>
          {loading ? (
            <div className="text-sm text-base-content/70">Loading...</div>
          ) : (
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-base-content/70">Last sync: </span>
                <span>{formatLastSync(syncStatus.lastSyncAt)}</span>
              </div>
              {syncStatus.lastSyncCount !== null && (
                <div>
                  <span className="text-base-content/70">Last sync count: </span>
                  <span>{syncStatus.lastSyncCount}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-2">Pending Review</h3>
          {loading ? (
            <div className="text-sm text-base-content/70">Loading...</div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm">
                <span className="text-base-content/70">Candidates pending: </span>
                <span className="font-semibold">{syncStatus.pendingCount}</span>
              </div>
              {syncStatus.pendingCount > 0 && webUrl && (
                <button
                  onClick={openMatchingPage}
                  className="btn btn-primary btn-sm w-full mt-2"
                >
                  Review Matches
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

