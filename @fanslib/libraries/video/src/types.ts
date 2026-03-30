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

export type AspectRatioPreset = "16:9" | "9:16" | "1:1" | "4:5";

export type CropOperation = {
  type: "crop";
  aspectRatio: AspectRatioPreset;
  centerX: RelativeCoordinate;
  centerY: RelativeCoordinate;
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
export type Operation = WatermarkOperation | CropOperation | BlurOperation | PixelateOperation | ZoomOperation;
