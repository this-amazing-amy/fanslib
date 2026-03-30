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

type PixelateRegionPreview = {
  x: number;
  y: number;
  width: number;
  height: number;
  pixelSize: number;
};

type EmojiPreview = {
  emoji: string;
  x: number;
  y: number;
  size: number;
};

const PreviewComposition = ({
  sourceUrl,
  watermark,
  watermarkUrl,
  blurRegions = [],
  pixelateRegions = [],
  emojis = [],
}: {
  sourceUrl: string;
  watermark?: { x: number; y: number; width: number; opacity: number };
  watermarkUrl?: string;
  blurRegions?: BlurRegionPreview[];
  pixelateRegions?: PixelateRegionPreview[];
  emojis?: EmojiPreview[];
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
    {pixelateRegions.map((px, i) => (
      <div
        key={`px-${i}`}
        style={{
          position: "absolute",
          left: `${px.x * 100}%`,
          top: `${px.y * 100}%`,
          width: `${px.width * 100}%`,
          height: `${px.height * 100}%`,
          backdropFilter: `blur(${px.pixelSize}px)`,
          WebkitBackdropFilter: `blur(${px.pixelSize}px)`,
          imageRendering: "pixelated",
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
    {emojis.map((em, i) => (
      <div
        key={`em-${i}`}
        style={{
          position: "absolute",
          left: `${em.x * 100}%`,
          top: `${em.y * 100}%`,
          fontSize: `${em.size * 1920}px`,
          lineHeight: 1,
          transform: "translate(-50%, -50%)",
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        {em.emoji}
      </div>
    ))}
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

  // Collect pixelate operations
  const pixelateOps = operations.filter(
    (op): op is PixelateRegionPreview & { type: "pixelate" } =>
      typeof op === "object" && op !== null && "type" in op && (op as { type: string }).type === "pixelate",
  );

  // Collect emoji operations
  const emojiOps = operations.filter(
    (op): op is EmojiPreview & { type: "emoji" } =>
      typeof op === "object" && op !== null && "type" in op && (op as { type: string }).type === "emoji",
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
          pixelateRegions: pixelateOps,
          emojis: emojiOps,
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
