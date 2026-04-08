import React from "react";
import { OffthreadVideo, useCurrentFrame } from "remotion";
import type { Operation } from "../types";

export type SegmentInput = {
  id: string;
  sourceMediaId: string;
  sourceUrl: string;
  sourceStartFrame: number;
  sourceEndFrame: number;
};

export type SequenceCompositionProps = {
  segments: SegmentInput[];
  /** Overlay operations positioned on the sequence timeline (not yet rendered — see #353) */
  operations?: Operation[];
  /** Asset URLs keyed by assetId */
  assetUrls?: Record<string, string>;
};

/**
 * Given segments (ordered), compute which one is active at the current frame.
 * For hard cuts (no transitions): segments play back-to-back sequentially.
 */
export const computeActiveSegment = (
  frame: number,
  segments: SegmentInput[],
): { segment: SegmentInput; sourceFrame: number } | null => {
  let cursor = 0;
  for (const segment of segments) {
    const duration = segment.sourceEndFrame - segment.sourceStartFrame;
    if (frame < cursor + duration) {
      return {
        segment,
        sourceFrame: segment.sourceStartFrame + (frame - cursor),
      };
    }
    cursor += duration;
  }
  return null;
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
      <OffthreadVideo
        src={active.segment.sourceUrl}
        startFrom={active.sourceFrame}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </div>
  );
};
