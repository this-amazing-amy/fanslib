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

  const clipTransition = (
    segment: Segment,
    pos: { sequenceStartFrame: number },
    clipped: ClippedSegment,
  ): ClippedSegment => {
    if (!segment.transition) return clipped;
    const transitionStart = pos.sequenceStartFrame;
    const transitionEnd = transitionStart + segment.transition.durationFrames;
    if (!(transitionEnd > region.startFrame && transitionStart < region.endFrame)) return clipped;
    const effectiveDuration = transitionEnd - Math.max(transitionStart, region.startFrame);
    if (effectiveDuration <= 0) return clipped;
    return { ...clipped, transition: { type: segment.transition.type, durationFrames: effectiveDuration } };
  };

  const clippedSegments = timeline.positions.reduce<ClippedSegment[]>((acc, pos, i) => {
    const segment = segments[i];
    if (!segment) return acc;
    if (pos.sequenceEndFrame <= region.startFrame || pos.sequenceStartFrame >= region.endFrame) return acc;

    const clampedSeqStart = Math.max(pos.sequenceStartFrame, region.startFrame);
    const clampedSeqEnd = Math.min(pos.sequenceEndFrame, region.endFrame);
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

    return [...acc, clipTransition(segment, pos, clipped)];
  }, []);

  const clipOperation = (
    typedOp: { startFrame?: number; endFrame?: number; [key: string]: unknown },
  ): ClippedOperation | null => {
    if (typedOp.startFrame == null || typedOp.endFrame == null) {
      return typedOp as ClippedOperation;
    }
    const opStart = typedOp.startFrame;
    const opEnd = typedOp.endFrame;
    if (opEnd <= region.startFrame || opStart >= region.endFrame) return null;
    return {
      ...typedOp,
      startFrame: Math.max(opStart, region.startFrame) - region.startFrame,
      endFrame: Math.min(opEnd, region.endFrame) - region.startFrame,
    };
  };

  const clippedOperations = tracks.flatMap((track) =>
    track.operations
      .map((op) => clipOperation(op as { startFrame?: number; endFrame?: number; [key: string]: unknown }))
      .filter((op): op is ClippedOperation => op !== null),
  );

  return {
    segments: clippedSegments,
    operations: clippedOperations,
    totalDuration: regionDuration,
  };
};
