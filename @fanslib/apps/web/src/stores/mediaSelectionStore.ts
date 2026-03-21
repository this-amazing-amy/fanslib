import type { Media } from "@fanslib/server/schemas";
import { create } from "zustand";

export type FlattenedMedia = {
  media: Media;
  groupKey: string;
  globalIndex: number;
};

const indexRange = (a: number, b: number) =>
  Array.from({ length: Math.abs(b - a) + 1 }, (_, i) => Math.min(a, b) + i);

const sortMediaByDate = (a: Media, b: Media) =>
  b.fileCreationDate.getTime() - a.fileCreationDate.getTime();

type MediaSelectionStore = {
  selectedIds: Set<string>;
  lastClickedIndex: number | null;
  isShiftPressed: boolean;
  flattenedMedia: FlattenedMedia[];
  mediaList: Media[];

  toggleItem: (id: string, globalIndex: number) => void;
  selectRange: (toIndex: number) => void;
  clearSelection: () => void;
  selectAll: () => void;
  setShiftPressed: (v: boolean) => void;
  setMedia: (media: Media[] | Map<string, Media[]>) => void;
};

export const useMediaSelectionStore = create<MediaSelectionStore>((set) => ({
  selectedIds: new Set(),
  lastClickedIndex: null,
  isShiftPressed: false,
  flattenedMedia: [],
  mediaList: [],

  toggleItem: (id, globalIndex) =>
    set((s) => {
      const next = new Set(s.selectedIds);
      next.has(id) ? next.delete(id) : next.add(id);
      return { selectedIds: next, lastClickedIndex: globalIndex };
    }),

  selectRange: (toIndex) =>
    set((s) => {
      const from = s.lastClickedIndex ?? toIndex;
      const range = indexRange(from, toIndex);
      const next = new Set(s.selectedIds);
      s.flattenedMedia
        .filter((m) => range.includes(m.globalIndex))
        .forEach((m) => next.add(m.media.id));
      return { selectedIds: next, lastClickedIndex: toIndex };
    }),

  clearSelection: () => set({ selectedIds: new Set(), lastClickedIndex: null }),

  selectAll: () => set((s) => ({ selectedIds: new Set(s.mediaList.map((m) => m.id)) })),

  setShiftPressed: (v) => set({ isShiftPressed: v }),

  setMedia: (media) => {
    // eslint-disable-next-line functional/no-let
    let flattenedMedia: FlattenedMedia[];
    // eslint-disable-next-line functional/no-let
    let mediaList: Media[];

    if (Array.isArray(media)) {
      mediaList = [...media].sort(sortMediaByDate);
      flattenedMedia = mediaList.map((m, i) => ({
        media: m,
        groupKey: "default",
        globalIndex: i,
      }));
    } else {
      const sortedKeys = Array.from(media.keys()).sort();
      // eslint-disable-next-line functional/no-let
      let globalIndex = 0;
      flattenedMedia = [];
      mediaList = [];

      sortedKeys.forEach((key) => {
        const groupMedia = media.get(key) ?? [];
        [...groupMedia].sort(sortMediaByDate).forEach((m) => {
          flattenedMedia.push({ media: m, groupKey: key, globalIndex: globalIndex++ });
          mediaList.push(m);
        });
      });
    }

    set({ flattenedMedia, mediaList, selectedIds: new Set(), lastClickedIndex: null });
  },
}));
