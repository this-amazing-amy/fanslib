import { atom } from "jotai";
import { writeSidebarCollapsedCookieToDocument } from "~/lib/sidebar-collapsed-preference";

export const mobileNavigationDrawerOpenAtom = atom<boolean>(false);

export const toggleSidebarAtom = atom(null, (get, set) => {
  set(mobileNavigationDrawerOpenAtom, !get(mobileNavigationDrawerOpenAtom));
});

export const openSidebarAtom = atom(null, (get, set) => {
  set(mobileNavigationDrawerOpenAtom, true);
});

export const closeSidebarAtom = atom(null, (get, set) => {
  set(mobileNavigationDrawerOpenAtom, false);
});

const baseSidebarCollapsedAtom = atom<boolean>(false);

export const sidebarCollapsedAtom = atom(
  (get) => get(baseSidebarCollapsedAtom),
  (get, set, newValue: boolean | ((prev: boolean) => boolean)) => {
    const valueToStore =
      typeof newValue === "function" ? newValue(get(baseSidebarCollapsedAtom)) : newValue;
    set(baseSidebarCollapsedAtom, valueToStore);
    if (typeof window !== "undefined") {
      writeSidebarCollapsedCookieToDocument(valueToStore);
    }
  },
);

export const toggleSidebarCollapsedAtom = atom(null, (get, set) => {
  set(sidebarCollapsedAtom, !get(sidebarCollapsedAtom));
});
