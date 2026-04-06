import type { WatermarkOperation } from "../types";

export type WatermarkCompositionProps = {
  sourceUrl: string;
  watermark: WatermarkOperation;
  watermarkUrl: string;
  /** Optional current frame for frame-range gating. When provided, the watermark
   *  is only visible if frame is within [startFrame, endFrame). */
  currentFrame?: number;
};

export const WatermarkComposition: React.FC<WatermarkCompositionProps> = ({
  sourceUrl,
  watermark,
  watermarkUrl,
  currentFrame,
}) => {
  const isVisible =
    currentFrame == null ||
    watermark.startFrame == null ||
    watermark.endFrame == null ||
    (currentFrame >= watermark.startFrame && currentFrame < watermark.endFrame);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <img
        src={sourceUrl}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
      {isVisible && (
        <img
          src={watermarkUrl}
          style={{
            position: "absolute",
            left: `${watermark.x * 100}%`,
            top: `${watermark.y * 100}%`,
            width: `${watermark.width * 100}%`,
            opacity: watermark.opacity,
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
};
