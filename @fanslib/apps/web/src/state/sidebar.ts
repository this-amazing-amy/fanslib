import { atom } from 'jotai';

export const sidebarOpenAtom = atom<boolean>(false);

export const toggleSidebarAtom = atom(null, (get, set) => {
  set(sidebarOpenAtom, !get(sidebarOpenAtom));
});

export const openSidebarAtom = atom(null, (get, set) => {
  set(sidebarOpenAtom, true);
});

export const closeSidebarAtom = atom(null, (get, set) => {
  set(sidebarOpenAtom, false);
});