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
  const { width, height } = useVideoConfig();

  const active = computeActiveSegment(frame, segments);

  if (!active) {
    return <div style={{ width: "100%", height: "100%", background: "#000" }} />;
  }

  const segment = segments.at(0);
  if (!segment) return <div style={{ width: "100%", height: "100%", background: "#000" }} />;

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
