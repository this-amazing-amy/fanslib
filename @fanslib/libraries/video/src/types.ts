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

/** Union of all supported edit operations */
export type Operation = WatermarkOperation | ClipOperation;
