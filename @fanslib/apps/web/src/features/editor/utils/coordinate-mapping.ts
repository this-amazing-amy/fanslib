export type CanvasRect = {
  canvasWidth: number;
  canvasHeight: number;
  compositionWidth: number;
  compositionHeight: number;
  /** Pixel offset from the positioning parent (e.g. player wrapper) to the composition viewport */
  offsetX?: number;
  offsetY?: number;
};

/**
 * Given the actual element size and composition aspect ratio,
 * compute the rendered content area (accounting for letterboxing/pillarboxing).
 */
export const getPlayerRect = (
  elementWidth: number,
  elementHeight: number,
  compositionWidth: number,
  compositionHeight: number,
): CanvasRect => {
  const compositionAspect = compositionWidth / compositionHeight;
  const elementAspect = elementWidth / elementHeight;

  const contentWidth =
    elementAspect > compositionAspect
      ? elementHeight * compositionAspect
      : elementWidth;
  const contentHeight =
    elementAspect > compositionAspect
      ? elementHeight
      : elementWidth / compositionAspect;

  return {
    canvasWidth: contentWidth,
    canvasHeight: contentHeight,
    compositionWidth,
    compositionHeight,
    offsetX: 0,
    offsetY: 0,
  };
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

/**
 * Convert pixel coordinates (relative to the same origin as `CanvasRect.offset*`, usually the overlay parent)
 * to relative 0-1 coordinates within the composition viewport.
 */
export const pixelToRelative = (
  px: number,
  py: number,
  canvas: CanvasRect,
): { x: number; y: number } => {
  const ox = canvas.offsetX ?? 0;
  const oy = canvas.offsetY ?? 0;
  return {
    x: clamp((px - ox) / canvas.canvasWidth, 0, 1),
    y: clamp((py - oy) / canvas.canvasHeight, 0, 1),
  };
};

/**
 * Convert relative 0-1 coordinates to pixel coordinates for `position: absolute`
 * inside the overlay parent (includes composition offset when present).
 */
export const relativeToPixel = (
  x: number,
  y: number,
  canvas: CanvasRect,
): { px: number; py: number } => {
  const ox = canvas.offsetX ?? 0;
  const oy = canvas.offsetY ?? 0;
  return {
    px: ox + x * canvas.canvasWidth,
    py: oy + y * canvas.canvasHeight,
  };
};
