import type { WatermarkOperation } from "../types";

export type WatermarkCompositionProps = {
  sourceUrl: string;
  watermark: WatermarkOperation;
  watermarkUrl: string;
};

export const WatermarkComposition: React.FC<WatermarkCompositionProps> = ({
  sourceUrl,
  watermark,
  watermarkUrl,
}) => (
  <div style={{ position: "relative", width: "100%", height: "100%" }}>
    <img
      src={sourceUrl}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "contain",
      }}
    />
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
  </div>
);
