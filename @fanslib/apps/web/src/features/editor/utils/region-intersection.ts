import type { Track } from "@fanslib/video/types";
import type { Segment } from "./sequence-engine";
import { computeSequenceTimeline } from "./sequence-engine";

type ExportRegion = { startFrame: number; endFrame: number };

type ClippedSegment = {
  id: string;
  sourceMediaId: string;
  sourceStartFrame: number;
  sourceEndFrame: number;
  sequenceStartFrame: number;
  sequenceEndFrame: number;
  transition?: { type: "crossfade"; durationFrames: number; easing?: string };
};

type ClippedOperation = {
  [key: string]: unknown;
  startFrame: number;
  endFrame: number;
};

type RegionIntersectionResult = {
  segments: ClippedSegment[];
  operations: ClippedOperation[];
  totalDuration: number;
};

export const intersectRegion = (
  segments: Segment[],
  tracks: Track[],
  region: ExportRegion,
): RegionIntersectionResult => {
  const regionDuration = region.endFrame - region.startFrame;

  if (regionDuration <= 0) {
    return { segments: [], operations: [], totalDuration: 0 };
  }

  const timeline = computeSequenceTimeline(segments);

  // Intersect segments
  const clippedSegments: ClippedSegment[] = [];
  for (let i = 0; i < timeline.positions.length; i++) {
    const pos = timeline.positions[i]!;
    const segment = segments[i]!;

    // Check overlap
    if (pos.sequenceEndFrame <= region.startFrame || pos.sequenceStartFrame >= region.endFrame) {
      continue;
    }

    const clampedSeqStart = Math.max(pos.sequenceStartFrame, region.startFrame);
    const clampedSeqEnd = Math.min(pos.sequenceEndFrame, region.endFrame);

    // How much was clipped from the start of this segment
    const startClip = clampedSeqStart - pos.sequenceStartFrame;
    const endClip = pos.sequenceEndFrame - clampedSeqEnd;

    const clipped: ClippedSegment = {
      id: segment.id,
      sourceMediaId: segment.sourceMediaId,
      sourceStartFrame: segment.sourceStartFrame + startClip,
      sourceEndFrame: segment.sourceEndFrame - endClip,
      sequenceStartFrame: clampedSeqStart - region.startFrame,
      sequenceEndFrame: clampedSeqEnd - region.startFrame,
    };

    // Handle transitions
    if (segment.transition) {
      const transitionStart = pos.sequenceStartFrame;
      const transitionEnd = pos.sequenceStartFrame + segment.transition.durationFrames;

      if (transitionEnd > region.startFrame && transitionStart < region.endFrame) {
        const effectiveStart = Math.max(transitionStart, region.startFrame);
        const effectiveDuration = transitionEnd - effectiveStart;

        if (effectiveDuration > 0) {
          clipped.transition = {
            type: segment.transition.type,
            durationFrames: effectiveDuration,
          };
        }
      }
    }

    clippedSegments.push(clipped);
  }

  // Intersect operations across all tracks
  const clippedOperations: ClippedOperation[] = [];
  for (const track of tracks) {
    for (const op of track.operations) {
      const typedOp = op as { startFrame?: number; endFrame?: number; [key: string]: unknown };

      // Operations without both startFrame and endFrame pass through unchanged
      if (typedOp.startFrame == null || typedOp.endFrame == null) {
        clippedOperations.push(typedOp as ClippedOperation);
        continue;
      }

      const opStart = typedOp.startFrame;
      const opEnd = typedOp.endFrame;

      // Check overlap
      if (opEnd <= region.startFrame || opStart >= region.endFrame) {
        continue;
      }

      const clampedStart = Math.max(opStart, region.startFrame) - region.startFrame;
      const clampedEnd = Math.min(opEnd, region.endFrame) - region.startFrame;

      clippedOperations.push({
        ...typedOp,
        startFrame: clampedStart,
        endFrame: clampedEnd,
      });
    }
  }

  return {
    segments: clippedSegments,
    operations: clippedOperations,
    totalDuration: regionDuration,
  };
};
