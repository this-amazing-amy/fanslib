import React from "react";
import { OffthreadVideo, useCurrentFrame, useVideoConfig } from "remotion";
import type {
  Operation,
  WatermarkOperation,
  BlurOperation,
  PixelateOperation,
  EmojiOperation,
  ZoomOperation,
  CropOperation,
  CaptionOperation,
} from "../types";
import { BlurRegion } from "./BlurRegion";
import { PixelateRegion } from "./PixelateRegion";
import { EmojiOverlay } from "./EmojiOverlay";
import { ZoomEffect } from "./ZoomEffect";
import { CropFrame } from "./CropFrame";
import { CaptionOverlay } from "./CaptionOverlay";

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
  operations = [],
  assetUrls = {},
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const active = computeActiveSegment(frame, segments);

  if (!active) {
    return <div style={{ width: "100%", height: "100%", background: "#000" }} />;
  }

  // Single-segment case: render the source video starting from the segment's source range
  const segment = segments[0]!;

  // Separate operations by type for layered rendering
  const zoomOps = operations.filter((o): o is ZoomOperation => o.type === "zoom");
  const cropOps = operations.filter((o): o is CropOperation => o.type === "crop");
  const watermarkOps = operations.filter((o): o is WatermarkOperation => o.type === "watermark");
  const blurOps = operations.filter((o): o is BlurOperation => o.type === "blur");
  const pixelateOps = operations.filter((o): o is PixelateOperation => o.type === "pixelate");
  const emojiOps = operations.filter((o): o is EmojiOperation => o.type === "emoji");
  const captionOps = operations.filter((o): o is CaptionOperation => o.type === "caption");

  // The active crop (if any)
  const activeCrop = cropOps.find((c) => {
    if (c.startFrame == null || c.endFrame == null) return true;
    return frame >= c.startFrame && frame < c.endFrame;
  });

  // The active zoom (if any)
  const activeZoom = zoomOps.find((z) => {
    if (z.startFrame == null || z.endFrame == null) return true;
    return frame >= z.startFrame && frame < z.endFrame;
  });

  const videoLayer = (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <OffthreadVideo
        src={segment.sourceUrl}
        startFrom={segment.sourceStartFrame}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />

      {/* Overlay operations */}
      {blurOps.map((blur) => (
        <BlurRegion key={blur.id} blur={blur} />
      ))}
      {pixelateOps.map((pix) => (
        <PixelateRegion key={pix.id} pixelate={pix} />
      ))}
      {watermarkOps.map((wm) => {
        const url = assetUrls[wm.assetId];
        if (!url) return null;
        const isVisible =
          wm.startFrame == null ||
          wm.endFrame == null ||
          (frame >= wm.startFrame && frame < wm.endFrame);
        if (!isVisible) return null;
        return (
          <img
            key={wm.id}
            src={url}
            style={{
              position: "absolute",
              left: `${wm.x * 100}%`,
              top: `${wm.y * 100}%`,
              width: `${wm.width * 100}%`,
              opacity: wm.opacity,
              pointerEvents: "none",
            }}
          />
        );
      })}
      {emojiOps.map((emoji) => (
        <EmojiOverlay
          key={emoji.id}
          emojiOp={emoji}
          compositionWidth={width}
          compositionHeight={height}
        />
      ))}
      {captionOps.map((caption) => (
        <CaptionOverlay key={caption.id} caption={caption} compositionWidth={width} />
      ))}
    </div>
  );

  // Apply zoom wrapping
  const zoomedLayer = activeZoom ? (
    <ZoomEffect zoom={activeZoom}>{videoLayer}</ZoomEffect>
  ) : (
    videoLayer
  );

  // Apply crop wrapping
  if (activeCrop) {
    return <CropFrame crop={activeCrop}>{zoomedLayer}</CropFrame>;
  }

  return zoomedLayer;
};
