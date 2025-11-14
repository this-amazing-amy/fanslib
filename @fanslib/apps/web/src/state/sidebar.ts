import { atom } from 'jotai';

const STORAGE_KEY = 'sidebarCollapsed';

const getInitialCollapsedState = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : false;
  } catch {
    return false;
  }
};

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

const baseSidebarCollapsedAtom = atom<boolean>(getInitialCollapsedState());

export const sidebarCollapsedAtom = atom(
  (get) => get(baseSidebarCollapsedAtom),
  (get, set, newValue: boolean | ((prev: boolean) => boolean)) => {
    const valueToStore = typeof newValue === 'function' ? newValue(get(baseSidebarCollapsedAtom)) : newValue;
    set(baseSidebarCollapsedAtom, valueToStore);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(valueToStore));
      } catch {
        // Ignore localStorage errors
      }
    }
  }
);

export const toggleSidebarCollapsedAtom = atom(null, (get, set) => {
  set(sidebarCollapsedAtom, !get(sidebarCollapsedAtom));
});