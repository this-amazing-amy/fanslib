
export type SessionStatus = {
  hasSession: boolean;
  isValid: boolean;
};

export type LoginStatus = {
  isLoggedIn: boolean;
  username?: string;
};

export type AuthStatus = {
  iconType: "loading" | "success" | "warning" | "expired" | "error";
  text: string;
  color: string;
  details: string | null;
  isStale: boolean;
};

export type CachedAuthStatus = {
  sessionStatus: SessionStatus | null;
  loginStatus: LoginStatus | null;
  lastChecked: string;
};

export const STORAGE_KEY = "reddit-auth-status";
export const STALE_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours

export const isStatusStale = (lastChecked: string): boolean => {
  const lastCheckedTime = new Date(lastChecked).getTime();
  const now = new Date().getTime();
  return now - lastCheckedTime > STALE_THRESHOLD;
};

export const loadCachedStatus = (): CachedAuthStatus | null => {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.warn("Failed to load cached auth status:", error);
    return null;
  }
};

export const saveCachedStatus = (
  sessionStatus: SessionStatus | null,
  loginStatus: LoginStatus | null
) => {
  try {
    const cached: CachedAuthStatus = {
      sessionStatus,
      loginStatus,
      lastChecked: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
  } catch (error) {
    console.warn("Failed to save cached auth status:", error);
  }
};

export const getAuthenticationStatus = (
  sessionStatus: SessionStatus | null,
  loginStatus: LoginStatus | null,
  isLoading: boolean,
  isStale: boolean
): AuthStatus => {
  if (isLoading) {
    return {
      iconType: "loading",
      text: "Checking authentication...",
      color: "text-base-content/60",
      details: null,
      isStale: false,
    };
  }

  const hasServerSession = sessionStatus?.hasSession && sessionStatus?.isValid;
  const isLoggedInDirectly = loginStatus?.isLoggedIn;
  const directUsername = loginStatus?.username;

  if (hasServerSession && isLoggedInDirectly) {
    return {
      iconType: "success",
      text: `Connected as u/${directUsername}`,
      color: isStale ? "text-warning" : "text-success",
      details: null,
      isStale,
    };
  }

  if (hasServerSession && !isLoggedInDirectly) {
    return {
      iconType: "warning",
      text: `Server session active but not logged in`,
      color: "text-warning",
      details: null,
      isStale,
    };
  }

  if (!hasServerSession && isLoggedInDirectly) {
    return {
      iconType: "warning",
      text: `Logged in as u/${directUsername} but no server session`,
      color: "text-warning",
      details: "Login to Reddit to save session to server",
      isStale,
    };
  }

  if (sessionStatus?.hasSession && !sessionStatus?.isValid) {
    return {
      iconType: "expired",
      text: `Session expired`,
      color: "text-warning",
      details: "Login again to restore session",
      isStale,
    };
  }

  return {
    iconType: "error",
    text: "Not authenticated",
    color: "text-error",
    details: "Click 'Login to Reddit' to authenticate",
    isStale,
  };
};
