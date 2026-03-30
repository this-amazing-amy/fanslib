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
    easing?: string;
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
    easing?: string;
  }>;
};

/** Union of all supported edit operations */
export type Operation = WatermarkOperation | CaptionOperation | BlurOperation | ZoomOperation;
