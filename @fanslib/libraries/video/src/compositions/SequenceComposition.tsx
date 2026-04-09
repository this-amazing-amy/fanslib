import React from "react";
import { OffthreadVideo, useCurrentFrame } from "remotion";
import type { Operation } from "../types";
import { VideoLayerWithOverlays } from "./VideoLayerWithOverlays";

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
  /** Overlay operations positioned on the sequence timeline */
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
  type TimingAcc = { starts: number[]; cursor: number };
  const { starts: timelineStarts, cursor: totalDuration } = segments.reduce<TimingAcc>(
    ({ starts, cursor }, seg, i) => {
      const start = i === 0 ? 0 : cursor - (seg.transition?.durationFrames ?? 0);
      return {
        starts: [...starts, start],
        cursor: start + (seg.sourceEndFrame - seg.sourceStartFrame),
      };
    },
    { starts: [], cursor: 0 },
  );

  if (frame >= totalDuration) return null;

  const activeIdx = segments.findIndex((seg, i) => {
    const segStart = timelineStarts[i] ?? 0;
    return frame >= segStart && frame < segStart + (seg.sourceEndFrame - seg.sourceStartFrame);
  });

  if (activeIdx === -1) return null;

  const seg = segments[activeIdx];
  const segStart = timelineStarts[activeIdx] ?? 0;
  if (!seg) return null;

  const sourceFrame = seg.sourceStartFrame + (frame - segStart);
  const nextSeg = segments[activeIdx + 1];
  const nextStart = timelineStarts[activeIdx + 1] ?? null;
  const nextTransition = nextSeg?.transition;

  if (
    nextTransition &&
    nextStart !== null &&
    frame >= nextStart &&
    frame < nextStart + nextTransition.durationFrames
  ) {
    // We are in the overlap zone: this segment is fading out, next is fading in
    const t = (frame - nextStart) / nextTransition.durationFrames;
    const easedT = applyEasing(t, nextTransition.easing);
    const nextSourceFrame = nextSeg.sourceStartFrame + (frame - nextStart);
    return {
      segments: [
        { segment: seg, sourceFrame, alpha: 1 - easedT },
        { segment: nextSeg, sourceFrame: nextSourceFrame, alpha: easedT },
      ],
    };
  }

  return { segments: [{ segment: seg, sourceFrame, alpha: 1 }] };
};

export const SequenceComposition: React.FC<SequenceCompositionProps> = ({
  segments,
  operations = [],
  assetUrls = {},
}) => {
  const frame = useCurrentFrame();

  const active = computeActiveSegment(frame, segments);

  if (!active) {
    return <div style={{ width: "100%", height: "100%", background: "#000" }} />;
  }

  return (
    <VideoLayerWithOverlays operations={operations} assetUrls={assetUrls}>
      {active.segments.map(({ segment, sourceFrame, alpha }, i) => (
        <OffthreadVideo
          key={segment.id}
          src={segment.sourceUrl}
          startFrom={sourceFrame}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            // Stack multiple segments for crossfade; first layer is positioned normally,
            // subsequent layers are absolutely positioned on top.
            ...(i > 0
              ? { position: "absolute", top: 0, left: 0 }
              : {}),
            opacity: alpha,
          }}
        />
      ))}
    </VideoLayerWithOverlays>
  );
};
