export const SIDEBAR_COLLAPSED_COOKIE_NAME = "fl_sidebar_collapsed";

const SECONDS_PER_YEAR = 60 * 60 * 24 * 365;

export const collapsedFromCookieValue = (raw: string | undefined): boolean => {
  if (raw === undefined || raw === "") return false;
  if (raw === "1" || raw === "true") return true;
  if (raw === "0" || raw === "false") return false;
  return false;
};

export const cookieValueFromCollapsed = (collapsed: boolean): string => (collapsed ? "1" : "0");

export const readCookieFromDocument = (name: string): string | undefined => {
  if (typeof document === "undefined") return undefined;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
};

export const writeSidebarCollapsedCookieToDocument = (collapsed: boolean): void => {
  if (typeof document === "undefined") return;
  const value = encodeURIComponent(cookieValueFromCollapsed(collapsed));
  const secure = typeof window !== "undefined" && window.location.protocol === "https:";
  const securePart = secure ? "; Secure" : "";
  document.cookie = `${SIDEBAR_COLLAPSED_COOKIE_NAME}=${value}; Path=/; Max-Age=${SECONDS_PER_YEAR}; SameSite=Lax${securePart}`;
};
