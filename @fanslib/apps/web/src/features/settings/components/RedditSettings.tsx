import { useCallback, useEffect, useState } from "react";
import {
    useClearRedditSessionMutation,
    useRedditLoginMutation,
    useRedditLoginStatusQuery,
    useRedditSessionStatusQuery,
} from "~/lib/queries/reddit";
import {
    getAuthenticationStatus,
    isStatusStale,
    loadCachedStatus,
    saveCachedStatus,
    type LoginStatus,
    type SessionStatus,
} from "~/lib/reddit/auth-status-utils";
import { SettingRow } from "./SettingRow";
import { AuthenticationActions } from "./reddit/AuthenticationActions";
import { AuthenticationStatus } from "./reddit/AuthenticationStatus";

export const RedditSettings = () => {
  // Load cached status from localStorage
  const [lastChecked, setLastChecked] = useState<string | null>(() => {
    const cached = loadCachedStatus();
    return cached?.lastChecked ?? null;
  });

  // Queries
  const loginStatusQuery = useRedditLoginStatusQuery();
  const sessionStatusQuery = useRedditSessionStatusQuery();

  // Mutations
  const loginMutation = useRedditLoginMutation();
  const clearSessionMutation = useClearRedditSessionMutation();

  // Update cache when queries succeed
  useEffect(() => {
    if (loginStatusQuery.data && sessionStatusQuery.data) {
      const now = new Date().toISOString();
      setLastChecked(now);
      saveCachedStatus(sessionStatusQuery.data, loginStatusQuery.data);
    }
  }, [loginStatusQuery.data, sessionStatusQuery.data]);

  const sessionStatus: SessionStatus | null = sessionStatusQuery.data ?? null;
  const loginStatus: LoginStatus | null = loginStatusQuery.data ?? null;

  const isLoading = sessionStatusQuery.isLoading || sessionStatusQuery.isFetching;
  const isCheckingLogin = loginStatusQuery.isLoading || loginStatusQuery.isFetching;
  const isStale = lastChecked ? isStatusStale(lastChecked) : true;

  const authStatus = getAuthenticationStatus(sessionStatus, loginStatus, isLoading, isStale);

  const handleRefresh = useCallback(async () => {
    await Promise.all([loginStatusQuery.refetch(), sessionStatusQuery.refetch()]);
  }, [loginStatusQuery, sessionStatusQuery]);

  const handleLogin = useCallback(async () => {
    try {
      await loginMutation.mutateAsync(undefined);
      // Queries will auto-refetch due to invalidation in the mutation
    } catch (error) {
      console.error("Login failed:", error);
    }
  }, [loginMutation]);

  const handleClearSession = useCallback(async () => {
    try {
      await clearSessionMutation.mutateAsync(undefined);
      // Queries will auto-refetch due to invalidation in the mutation
    } catch (error) {
      console.error("Clear session failed:", error);
    }
  }, [clearSessionMutation]);

  return (
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
          description="Current authentication status and session management"
        >
          <div className="space-y-4">
            <AuthenticationStatus
              authStatus={authStatus}
              lastChecked={lastChecked}
              isLoading={isLoading}
              isCheckingLogin={isCheckingLogin}
              onRefresh={handleRefresh}
            />

            <AuthenticationActions
              sessionStatus={sessionStatus}
              isLoggingIn={loginMutation.isPending}
              isClearing={clearSessionMutation.isPending}
              onLogin={handleLogin}
              onClearSession={handleClearSession}
            />
          </div>
        </SettingRow>
      </div>
    </div>
  );
};
