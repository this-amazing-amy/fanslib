import { useLayoutEffect, useState, type RefObject } from "react";
import type { CanvasRect } from "../utils/coordinate-mapping";

export const REMOTION_PLAYER_CLASS = "__remotion-player";

/**
 * Tracks the DOM rect of Remotion's scaled composition layer (`.__remotion-player`).
 * That layer matches the preview coordinate system; the Player root also includes
 * the control bar, so mapping 0–1 to the full player wrapper is wrong for video.
 */
export const useRemotionCompositionViewport = (
  playerAreaRef: RefObject<HTMLDivElement | null>,
  compositionWidth: number,
  compositionHeight: number,
): CanvasRect | null => {
  const [rect, setRect] = useState<CanvasRect | null>(null);

  useLayoutEffect(() => {
    const root = playerAreaRef.current;
    if (!root) return;

    const measure = () => {
      const slot = root.querySelector(`.${REMOTION_PLAYER_CLASS}`) as HTMLElement | null;
      if (!slot) {
        setRect(null);
        return;
      }
      const rootBox = root.getBoundingClientRect();
      const slotBox = slot.getBoundingClientRect();
      setRect({
        canvasWidth: slotBox.width,
        canvasHeight: slotBox.height,
        compositionWidth,
        compositionHeight,
        offsetX: slotBox.left - rootBox.left,
        offsetY: slotBox.top - rootBox.top,
      });
    };

    measure();

    const ro = new ResizeObserver(() => {
      measure();
    });
    ro.observe(root);

    const mo = new MutationObserver(() => {
      measure();
    });
    mo.observe(root, { childList: true, subtree: true });

    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, [playerAreaRef, compositionWidth, compositionHeight]);

  return rect;
};
