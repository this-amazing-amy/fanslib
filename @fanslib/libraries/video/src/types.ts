import type { EasingType } from "./keyframes";

/** A number between 0 and 1 representing a relative position or size */
export type RelativeCoordinate = number;

export type WatermarkOperation = {
  type: "watermark";
  assetId: string;
  x: RelativeCoordinate;
  y: RelativeCoordinate;
  width: RelativeCoordinate;
  opacity: RelativeCoordinate;
};

export type ClipOperation = {
  type: "clip";
  startFrame: number;
  endFrame: number;
};

export type CropAspectPreset = "16:9" | "9:16" | "1:1" | "4:5" | "free";

/** Normalized rect in composition space; optional UI-only fields may be stripped before render. */
export type CropOperation = {
  type: "crop";
  x: RelativeCoordinate;
  y: RelativeCoordinate;
  width: RelativeCoordinate;
  height: RelativeCoordinate;
  applied?: boolean;
  aspectPreset?: CropAspectPreset;
};

export type CaptionAnimation = "typewriter" | "fade-in" | "scale-in" | "slide-up";

export type CaptionOperation = {
  type: "caption";
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
  x: RelativeCoordinate;
  y: RelativeCoordinate;
  width: RelativeCoordinate;
  height: RelativeCoordinate;
  radius: number;
  keyframes: Array<{
    frame: number;
    values: Record<string, number>;
    easing?: EasingType;
  }>;
};

export type PixelateOperation = {
  type: "pixelate";
  x: RelativeCoordinate;
  y: RelativeCoordinate;
  width: RelativeCoordinate;
  height: RelativeCoordinate;
  pixelSize: number;
  keyframes: Array<{
    frame: number;
    values: Record<string, number>;
    easing?: EasingType;
  }>;
};

export type EmojiOperation = {
  type: "emoji";
  emoji: string;
  x: RelativeCoordinate;
  y: RelativeCoordinate;
  size: RelativeCoordinate;
  keyframes: Array<{
    frame: number;
    values: Record<string, number>;
    easing?: EasingType;
  }>;
};

export type ZoomOperation = {
  type: "zoom";
  scale: number;
  centerX: RelativeCoordinate;
  centerY: RelativeCoordinate;
  keyframes: Array<{
    frame: number;
    values: Record<string, number>;
    easing?: EasingType;
  }>;
};

/** Union of all supported edit operations */
export type Operation = WatermarkOperation | ClipOperation | CropOperation | CaptionOperation | BlurOperation | PixelateOperation | EmojiOperation | ZoomOperation;
