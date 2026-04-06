type FrameRange = { startFrame: number; endFrame: number };

/** Shift both start and end by deltaFrames, clamping to [0, lastFrame] */
export const computeMove = (
  range: FrameRange,
  deltaFrames: number,
  lastFrame: number,
): FrameRange => {
  const duration = range.endFrame - range.startFrame;
  const rawStart = range.startFrame + deltaFrames;
  const clampedStart = Math.max(0, Math.min(rawStart, lastFrame - duration));
  return { startFrame: clampedStart, endFrame: clampedStart + duration };
};

/** Move only startFrame by deltaFrames, clamping to [0, endFrame - 1] */
export const computeTrimStart = (
  range: FrameRange,
  deltaFrames: number,
  _lastFrame: number,
): FrameRange => {
  const raw = range.startFrame + deltaFrames;
  const clamped = Math.max(0, Math.min(raw, range.endFrame - 1));
  return { startFrame: clamped, endFrame: range.endFrame };
};

/** Move only endFrame by deltaFrames, clamping to [startFrame + 1, lastFrame] */
export const computeTrimEnd = (
  range: FrameRange,
  deltaFrames: number,
  lastFrame: number,
): FrameRange => {
  const raw = range.endFrame + deltaFrames;
  const clamped = Math.max(range.startFrame + 1, Math.min(raw, lastFrame));
  return { startFrame: range.startFrame, endFrame: clamped };
};

/** Detect which part of a block was clicked: left edge, right edge, or body */
export const detectEdge = (
  offsetX: number,
  blockWidth: number,
  edgeZone: number,
): "left" | "right" | "body" => {
  // For narrow blocks, treat center region as body
  if (blockWidth <= edgeZone * 2) return "body";
  if (offsetX <= edgeZone) return "left";
  if (offsetX >= blockWidth - edgeZone) return "right";
  return "body";
};
