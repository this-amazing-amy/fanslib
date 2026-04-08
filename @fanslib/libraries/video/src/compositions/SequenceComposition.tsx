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

export const SequenceComposition: React.FC<SequenceCompositionProps> = ({
  segments,
  // operations and assetUrls intentionally unused — overlay rendering comes in #353
}) => {
  const frame = useCurrentFrame();

  if (segments.length === 0) {
    return <div style={{ width: "100%", height: "100%", background: "#000" }} />;
  }

  // Single-segment case: render the source video starting from the segment's source range
  const segment = segments[0]!;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <OffthreadVideo
        src={segment.sourceUrl}
        startFrom={segment.sourceStartFrame}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </div>
  );
};
