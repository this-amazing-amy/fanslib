import type { Segment, SequenceTimeline } from "~/features/editor/utils/sequence-engine";

/**
 * Given the mouse X position during drag, compute which index
 * the dragged segment should land at.
 * Compares mouseX to midpoints of other segment blocks to determine insertion point.
 */
export const computeSegmentReorderIndex = (
  segments: Segment[],
  draggedSegmentId: string,
  mouseX: number,
  pixelsPerFrame: number,
  timeline: SequenceTimeline,
): number => {
  const draggedIndex = segments.findIndex((s) => s.id === draggedSegmentId);
  if (draggedIndex === -1) return 0;

  // Walk through positions (excluding the dragged segment) and find where mouseX falls
  return timeline.positions
    .filter((pos) => pos.segmentId !== draggedSegmentId)
    .reduce((insertIndex, pos) => {
      const midX = ((pos.sequenceStartFrame + pos.sequenceEndFrame) / 2) * pixelsPerFrame;
      if (mouseX <= midX) return insertIndex;
      // We're past this segment's midpoint, so insert after it.
      const segIndex = segments.findIndex((s) => s.id === pos.segmentId);
      return segIndex >= draggedIndex ? segIndex : segIndex + 1;
    }, 0);
};

/** Adjust sourceStartFrame by delta, clamped to [0, sourceEndFrame - 1] */
export const computeSegmentTrimStart = (
  segment: Segment,
  deltaFrames: number,
): { sourceStartFrame: number } => {
  const newStart = Math.max(0, Math.min(segment.sourceStartFrame + deltaFrames, segment.sourceEndFrame - 1));
  return { sourceStartFrame: newStart };
};

/** Adjust sourceEndFrame by delta, clamped to [sourceStartFrame + 1, Infinity] */
export const computeSegmentTrimEnd = (
  segment: Segment,
  deltaFrames: number,
): { sourceEndFrame: number } => {
  const newEnd = Math.max(segment.sourceStartFrame + 1, segment.sourceEndFrame + deltaFrames);
  return { sourceEndFrame: newEnd };
};
