import { useRef } from "react";
import { Player } from "@remotion/player";
import { AbsoluteFill, Img } from "remotion";
import { RegionOverlay } from "./RegionOverlay";

/**
 * A simple preview composition that renders the source media with optional watermark overlay.
 * This is a client-side preview — actual rendering uses @fanslib/video compositions server-side.
 */
type BlurRegionPreview = {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
};

const PreviewComposition = ({
  sourceUrl,
  watermark,
  watermarkUrl,
  blurRegions = [],
}: {
  sourceUrl: string;
  watermark?: { x: number; y: number; width: number; opacity: number };
  watermarkUrl?: string;
  blurRegions?: BlurRegionPreview[];
}) => (
  <AbsoluteFill>
    <Img src={sourceUrl} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
    {blurRegions.map((blur, i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          left: `${blur.x * 100}%`,
          top: `${blur.y * 100}%`,
          width: `${blur.width * 100}%`,
          height: `${blur.height * 100}%`,
          backdropFilter: `blur(${blur.radius}px)`,
          WebkitBackdropFilter: `blur(${blur.radius}px)`,
        }}
      />
    ))}
    {watermark && watermarkUrl && (
      <Img
        src={watermarkUrl}
        style={{
          position: "absolute",
          left: `${watermark.x * 100}%`,
          top: `${watermark.y * 100}%`,
          width: `${watermark.width * 100}%`,
          opacity: watermark.opacity,
        }}
      />
    )}
  </AbsoluteFill>
);

type EditorCanvasProps = {
  mediaId: string;
  mediaType: "image" | "video";
  operations: unknown[];
};

export const EditorCanvas = ({ mediaId, mediaType, operations }: EditorCanvasProps) => {
  const sourceUrl = `/api/media/${mediaId}/file`;

  // Find watermark operation if any
  const watermarkOp = operations.find(
    (op): op is { type: "watermark"; assetId: string; x: number; y: number; width: number; opacity: number } =>
      typeof op === "object" && op !== null && "type" in op && (op as { type: string }).type === "watermark",
  );

  const watermarkUrl = watermarkOp ? `/api/assets/${watermarkOp.assetId}/file` : undefined;

  // Collect blur operations
  const blurOps = operations.filter(
    (op): op is BlurRegionPreview & { type: "blur" } =>
      typeof op === "object" && op !== null && "type" in op && (op as { type: string }).type === "blur",
  );

  const isVideo = mediaType === "video";

  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="flex-1 flex items-center justify-center bg-base-300 overflow-hidden p-4 relative">
      <Player
        component={PreviewComposition}
        inputProps={{
          sourceUrl,
          watermark: watermarkOp,
          watermarkUrl,
          blurRegions: blurOps,
        }}
        durationInFrames={isVideo ? 900 : 1}
        compositionWidth={1920}
        compositionHeight={1080}
        fps={30}
        style={{
          width: "100%",
          maxHeight: "100%",
          aspectRatio: "16/9",
        }}
        controls={isVideo}
        loop={isVideo}
      />
      <RegionOverlay containerRef={containerRef} />
    </div>
  );
};
