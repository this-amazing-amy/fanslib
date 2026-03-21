import { create } from "zustand";

type MediaHoverStore = {
  hoveredMediaId: string | null;
  setHoveredMediaId: (id: string | null) => void;
};

export const useMediaHoverStore = create<MediaHoverStore>((set) => ({
  hoveredMediaId: null,
  setHoveredMediaId: (id) => set({ hoveredMediaId: id }),
}));
