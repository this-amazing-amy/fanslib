import { useCallback } from "react";
import { useClipStore } from "~/stores/clipStore";

/**
 * Hook that converts a raw frame number to a (optionally snapped) frame,
 * clamped to [0, totalFrames]. When snapping, frames align to 0.5s steps
 * relative to the pending mark-in anchor (or frame 0 if none is set).
 */
export const useSnapToFrame = (fps: number, totalFrames: number) => {
  const pendingMarkInFrame = useClipStore((s) => s.pendingMarkInFrame);

  return useCallback(
    (rawFrame: number, snap: boolean): number => {
      let frame = rawFrame;
      if (snap) {
        const anchor = pendingMarkInFrame ?? 0;
        const relativeSeconds = (frame - anchor) / fps;
        const snappedRelative = Math.round(relativeSeconds * 2) / 2; // 0.5s steps
        frame = anchor + Math.round(snappedRelative * fps);
      }
      return Math.max(0, Math.min(totalFrames, frame));
    },
    [fps, totalFrames, pendingMarkInFrame],
  );
};
