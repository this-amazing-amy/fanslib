import { Composition } from "remotion";
import { WatermarkComposition } from "./compositions/WatermarkComposition";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="WatermarkComposition"
    component={WatermarkComposition}
    durationInFrames={1}
    fps={30}
    width={1920}
    height={1080}
    defaultProps={{
      sourceUrl: "",
      watermark: {
        type: "watermark" as const,
        id: "default",
        assetId: "",
        x: 0,
        y: 0,
        width: 0.1,
        opacity: 1,
      },
      watermarkUrl: "",
    }}
  />
);
