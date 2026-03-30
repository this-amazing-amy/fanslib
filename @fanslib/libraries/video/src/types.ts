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

export type EmojiOperation = {
  type: "emoji";
  emoji: string;
  x: RelativeCoordinate;
  y: RelativeCoordinate;
  size: RelativeCoordinate;
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
export type Operation = WatermarkOperation | ClipOperation | BlurOperation | EmojiOperation | ZoomOperation;
