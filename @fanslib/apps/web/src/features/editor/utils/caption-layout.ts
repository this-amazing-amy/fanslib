import { measureText } from "@remotion/layout-utils";
import { interpolate } from "remotion";
import type { CaptionOperation } from "@fanslib/video/types";

const COMPOSITION_HEIGHT = 1080;

export const isCaptionOperation = (op: unknown): op is CaptionOperation =>
  typeof op === "object" &&
  op !== null &&
  "type" in op &&
  (op as { type: string }).type === "caption" &&
  typeof (op as CaptionOperation).text === "string" &&
  typeof (op as CaptionOperation).fontSize === "number";

/**
 * Pixel size of the caption's bounding box in **the same space as** {@link RegionOverlay}
 * (scaled player viewport: `canvas.canvasWidth` / `canvas.canvasHeight`).
 *
 * Remotion renders at composition resolution then scales to the player. Effective on-screen
 * font size is `caption.fontSize * canvasWidthPx`, not `caption.fontSize * compositionWidth`.
 * Measuring at composition px and comparing to viewport px was inflating widths past the
 * canvas and forcing a full-width selection box.
 */
export const measureCaptionBoxPx = (
  caption: CaptionOperation,
  canvasWidthPx: number,
): { widthPx: number; heightPx: number } => {
  const fontSizePx = caption.fontSize * canvasWidthPx;
  const fontFamily = caption.fontFamily ?? "sans-serif";
  const strokePad = (caption.strokeWidth ?? 0) * 2;
  const lines = caption.text.split("\n");
  const maxWidthPx = canvasWidthPx;

  const blocks = lines.map((line) => {
    const m = measureText({
      text: line.length === 0 ? " " : line,
      fontFamily,
      fontSize: fontSizePx,
      fontWeight: "400",
      letterSpacing: "normal",
    });
    const w = m.width;
    const h = m.height;
    if (w <= maxWidthPx || line.length === 0) {
      return { w, h };
    }
    const rows = Math.ceil(w / maxWidthPx);
    return { w: maxWidthPx, h: rows * h };
  });

  const widthPx = Math.max(...blocks.map((b) => b.w), 0) + strokePad;
  const heightPx = blocks.reduce((sum, b) => sum + b.h, 0) + strokePad;

  return { widthPx, heightPx };
};

export const captionHalfNormFromBox = (
  widthPx: number,
  heightPx: number,
  canvasWidth: number,
  canvasHeight: number,
): { halfWNorm: number; halfHNorm: number } => ({
  halfWNorm: widthPx / 2 / canvasWidth,
  halfHNorm: heightPx / 2 / canvasHeight,
});

/**
 * Extra offset (viewport px) for the caption box so it tracks {@link CaptionOverlay}
 * CSS transforms at `frame`. Matches `singleFramePreview` when `previewDurationInFrames <= 1`.
 */
export const captionAnimationViewportOffsetPx = (
  caption: CaptionOperation,
  frame: number,
  canvasHeight: number,
  previewDurationInFrames: number,
): { dx: number; dy: number } => {
  if (previewDurationInFrames <= 1) {
    return { dx: 0, dy: 0 };
  }
  const { startFrame, endFrame, animation } = caption;
  if (frame < startFrame || frame > endFrame) {
    return { dx: 0, dy: 0 };
  }
  const localFrame = frame - startFrame;
  const duration = endFrame - startFrame;
  if (duration <= 0) return { dx: 0, dy: 0 };
  const scaleY = canvasHeight / COMPOSITION_HEIGHT;

  switch (animation) {
    case "slide-up": {
      const y = interpolate(localFrame, [0, Math.min(15, duration)], [50, 0], {
        extrapolateRight: "clamp",
      });
      return { dx: 0, dy: y * scaleY };
    }
    case "scale-in":
      return { dx: 0, dy: 0 };
    case "fade-in":
    case "typewriter":
    default:
      return { dx: 0, dy: 0 };
  }
};
