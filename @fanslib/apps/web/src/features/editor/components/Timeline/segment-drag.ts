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
  let insertIndex = 0;
  for (let i = 0; i < timeline.positions.length; i++) {
    if (timeline.positions[i]!.segmentId === draggedSegmentId) continue;
    const pos = timeline.positions[i]!;
    const midX = ((pos.sequenceStartFrame + pos.sequenceEndFrame) / 2) * pixelsPerFrame;
    if (mouseX > midX) {
      // We're past this segment's midpoint, so insert after it.
      // Find the actual index of this segment in the segments array.
      const segIndex = segments.findIndex((s) => s.id === pos.segmentId);
      insertIndex = segIndex >= draggedIndex ? segIndex : segIndex + 1;
    }
  }

  return insertIndex;
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
