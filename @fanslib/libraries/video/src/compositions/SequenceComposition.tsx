import React from "react";
import { OffthreadVideo, useCurrentFrame } from "remotion";
import type { Operation } from "../types";

export type SegmentInput = {
  id: string;
  sourceMediaId: string;
  sourceUrl: string;
  sourceStartFrame: number;
  sourceEndFrame: number;
  transition?: {
    type: "crossfade";
    durationFrames: number;
    easing?: string;
  };
};

export type ActiveSegmentResult = {
  segments: Array<{
    segment: SegmentInput;
    sourceFrame: number;
    alpha: number;
  }>;
};

export type SequenceCompositionProps = {
  segments: SegmentInput[];
  /** Overlay operations positioned on the sequence timeline (not yet rendered — see #353) */
  operations?: Operation[];
  /** Asset URLs keyed by assetId */
  assetUrls?: Record<string, string>;
};

/**
 * Apply easing to a linear progress value t (0..1).
 */
const applyEasing = (t: number, easing?: string): number => {
  switch (easing) {
    case "ease-in":
      return t * t;
    case "ease-out":
      return 1 - (1 - t) * (1 - t);
    case "ease-in-out":
      // Cubic bezier approximation: smooth-step
      return t * t * (3 - 2 * t);
    default:
      return t; // linear
  }
};

/**
 * Given segments (ordered), compute which ones are active at the current frame.
 *
 * For hard cuts (no transitions): segments play back-to-back sequentially.
 * For crossfade transitions: segment B starts `durationFrames` earlier than a
 * hard cut, creating an overlap with segment A where both are returned with
 * interpolated alpha values.
 */
export const computeActiveSegment = (
  frame: number,
  segments: SegmentInput[],
): ActiveSegmentResult | null => {
  if (segments.length === 0) return null;

  // Build timeline positions: each segment has a timelineStart that accounts
  // for transitions pulling it earlier.
  const timelineStarts: number[] = [];
  let cursor = 0;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]!;
    if (i === 0) {
      timelineStarts.push(0);
      cursor = seg.sourceEndFrame - seg.sourceStartFrame;
    } else {
      const overlap = seg.transition?.durationFrames ?? 0;
      const start = cursor - overlap;
      timelineStarts.push(start);
      cursor = start + (seg.sourceEndFrame - seg.sourceStartFrame);
    }
  }

  // Total timeline duration
  const totalDuration = cursor;
  if (frame >= totalDuration) return null;

  // Find which segment(s) are active at this frame.
  // Walk backwards to find overlapping segments.
  const active: ActiveSegmentResult["segments"] = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]!;
    const segStart = timelineStarts[i]!;
    const segDuration = seg.sourceEndFrame - seg.sourceStartFrame;
    const segEnd = segStart + segDuration;

    if (frame >= segStart && frame < segEnd) {
      const sourceFrame = seg.sourceStartFrame + (frame - segStart);

      // Check if we are in the transition overlap zone of the NEXT segment
      const nextSeg = segments[i + 1];
      const nextStart = i + 1 < segments.length ? timelineStarts[i + 1]! : null;
      const nextTransition = nextSeg?.transition;

      if (
        nextTransition &&
        nextStart !== null &&
        frame >= nextStart &&
        frame < nextStart + nextTransition.durationFrames
      ) {
        // We are in the overlap zone: this segment is fading out
        const t = (frame - nextStart) / nextTransition.durationFrames;
        const easedT = applyEasing(t, nextTransition.easing);
        active.push({ segment: seg, sourceFrame, alpha: 1 - easedT });

        // And the next segment is fading in
        const nextSourceFrame =
          nextSeg!.sourceStartFrame + (frame - nextStart);
        active.push({
          segment: nextSeg!,
          sourceFrame: nextSourceFrame,
          alpha: easedT,
        });
        // We've handled both segments, skip the next one in the loop
        break;
      } else {
        // No overlap — single segment active
        active.push({ segment: seg, sourceFrame, alpha: 1 });
        break;
      }
    }
  }

  if (active.length === 0) return null;

  return { segments: active };
};

export const SequenceComposition: React.FC<SequenceCompositionProps> = ({
  segments,
  // operations and assetUrls intentionally unused — overlay rendering comes in #353
}) => {
  const frame = useCurrentFrame();

  const active = computeActiveSegment(frame, segments);

  if (!active) {
    return <div style={{ width: "100%", height: "100%", background: "#000" }} />;
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {active.segments.map((entry) => (
        <OffthreadVideo
          key={entry.segment.id}
          src={entry.segment.sourceUrl}
          startFrom={entry.sourceFrame}
          style={{
            position: active.segments.length > 1 ? "absolute" : undefined,
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            opacity: entry.alpha,
          }}
        />
      ))}
    </div>
  );
};
