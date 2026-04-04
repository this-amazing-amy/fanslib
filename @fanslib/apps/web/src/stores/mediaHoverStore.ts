import { create } from "zustand";

type MediaHoverStore = {
  hoveredMediaId: string | null;
  hoveredInstanceId: string | null;
  setHovered: (mediaId: string | null, instanceId: string | null) => void;
  /** @deprecated Use setHovered instead */
  setHoveredMediaId: (id: string | null) => void;
};

export const useMediaHoverStore = create<MediaHoverStore>((set) => ({
  hoveredMediaId: null,
  hoveredInstanceId: null,
  setHovered: (mediaId, instanceId) =>
    set({ hoveredMediaId: mediaId, hoveredInstanceId: instanceId }),
  setHoveredMediaId: (id) => set({ hoveredMediaId: id, hoveredInstanceId: id }),
}));
