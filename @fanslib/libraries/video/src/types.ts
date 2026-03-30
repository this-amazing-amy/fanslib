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
export type Operation = WatermarkOperation | ZoomOperation;
