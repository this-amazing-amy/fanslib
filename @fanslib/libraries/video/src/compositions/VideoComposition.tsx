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

export type VideoCompositionProps = {
  sourceUrl: string;
  /** Frame offset into the source video (for clip exports) */
  startFrom?: number;
  operations?: Operation[];
  /** Watermark asset URLs keyed by assetId */
  assetUrls?: Record<string, string>;
};

export const VideoComposition: React.FC<VideoCompositionProps> = ({
  sourceUrl,
  startFrom = 0,
  operations = [],
  assetUrls = {},
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

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
        src={sourceUrl}
        startFrom={startFrom}
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
