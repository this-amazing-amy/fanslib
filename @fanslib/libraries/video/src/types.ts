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

/** Union of all supported edit operations */
export type Operation = WatermarkOperation | CaptionOperation;
