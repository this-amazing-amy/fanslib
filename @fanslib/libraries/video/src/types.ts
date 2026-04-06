import type { EasingType } from "./keyframes";

/** A number between 0 and 1 representing a relative position or size */
export type RelativeCoordinate = number;

export type WatermarkOperation = {
  type: "watermark";
  id: string;
  assetId: string;
  x: RelativeCoordinate;
  y: RelativeCoordinate;
  width: RelativeCoordinate;
  opacity: RelativeCoordinate;
  startFrame?: number;
  endFrame?: number;
};

export type ClipOperation = {
  type: "clip";
  id: string;
  startFrame: number;
  endFrame: number;
};

export type CropAspectPreset = "16:9" | "9:16" | "1:1" | "4:5" | "free";

/** Normalized rect in composition space; optional UI-only fields may be stripped before render. */
export type CropOperation = {
  type: "crop";
  id: string;
  x: RelativeCoordinate;
  y: RelativeCoordinate;
  width: RelativeCoordinate;
  height: RelativeCoordinate;
  applied?: boolean;
  aspectPreset?: CropAspectPreset;
  startFrame?: number;
  endFrame?: number;
};

export type CaptionAnimation = "typewriter" | "fade-in" | "scale-in" | "slide-up";

export type CaptionOperation = {
  type: "caption";
  id: string;
  text: string;
  x: RelativeCoordinate;
  y: RelativeCoordinate;
  fontSize: RelativeCoordinate;
  fontFamily?: string;
  color: string;
  strokeColor?: string;
  strokeWidth?: number;
  animation: CaptionAnimation;
  startFrame: number;
  endFrame: number;
};

export type BlurOperation = {
  type: "blur";
  id: string;
  x: RelativeCoordinate;
  y: RelativeCoordinate;
  width: RelativeCoordinate;
  height: RelativeCoordinate;
  radius: number;
  startFrame?: number;
  endFrame?: number;
  keyframes: Array<{
    frame: number;
    values: Record<string, number>;
    easing?: EasingType;
  }>;
};

export type PixelateOperation = {
  type: "pixelate";
  id: string;
  x: RelativeCoordinate;
  y: RelativeCoordinate;
  width: RelativeCoordinate;
  height: RelativeCoordinate;
  pixelSize: number;
  startFrame?: number;
  endFrame?: number;
  keyframes: Array<{
    frame: number;
    values: Record<string, number>;
    easing?: EasingType;
  }>;
};

export type EmojiOperation = {
  type: "emoji";
  id: string;
  emoji: string;
  x: RelativeCoordinate;
  y: RelativeCoordinate;
  size: RelativeCoordinate;
  startFrame?: number;
  endFrame?: number;
  keyframes: Array<{
    frame: number;
    values: Record<string, number>;
    easing?: EasingType;
  }>;
};

export type ZoomOperation = {
  type: "zoom";
  id: string;
  scale: number;
  centerX: RelativeCoordinate;
  centerY: RelativeCoordinate;
  startFrame?: number;
  endFrame?: number;
  keyframes: Array<{
    frame: number;
    values: Record<string, number>;
    easing?: EasingType;
  }>;
};

/** Union of all supported edit operations */
export type Operation = WatermarkOperation | ClipOperation | CropOperation | CaptionOperation | BlurOperation | PixelateOperation | EmojiOperation | ZoomOperation;
