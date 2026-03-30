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

export type AudioOperation = {
  type: "audio";
  assetId: string;
  offsetFrames: number;
  crossfade: number; // 0 = original only, 1 = music only
};

/** Union of all supported edit operations */
export type Operation = WatermarkOperation | AudioOperation;
