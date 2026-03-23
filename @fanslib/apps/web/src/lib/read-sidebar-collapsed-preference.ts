import { createIsomorphicFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import {
  SIDEBAR_COLLAPSED_COOKIE_NAME,
  collapsedFromCookieValue,
  readCookieFromDocument,
} from "~/lib/sidebar-collapsed-preference";

export const readSidebarCollapsedPreference = createIsomorphicFn()
  .server(() => collapsedFromCookieValue(getCookie(SIDEBAR_COLLAPSED_COOKIE_NAME)))
  .client(() => collapsedFromCookieValue(readCookieFromDocument(SIDEBAR_COLLAPSED_COOKIE_NAME)));
