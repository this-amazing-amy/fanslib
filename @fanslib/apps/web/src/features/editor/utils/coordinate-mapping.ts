export type CanvasRect = {
  canvasWidth: number;
  canvasHeight: number;
  compositionWidth: number;
  compositionHeight: number;
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
  };
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

/**
 * Convert pixel coordinates (relative to the rendered Player content area)
 * to relative 0-1 coordinates.
 */
export const pixelToRelative = (
  px: number,
  py: number,
  canvas: CanvasRect,
): { x: number; y: number } => ({
  x: clamp(px / canvas.canvasWidth, 0, 1),
  y: clamp(py / canvas.canvasHeight, 0, 1),
});

/**
 * Convert relative 0-1 coordinates to pixel coordinates
 * within the rendered Player content area.
 */
export const relativeToPixel = (
  x: number,
  y: number,
  canvas: CanvasRect,
): { px: number; py: number } => ({
  px: x * canvas.canvasWidth,
  py: y * canvas.canvasHeight,
});
