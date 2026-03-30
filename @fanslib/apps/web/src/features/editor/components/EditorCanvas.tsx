import { Player } from "@remotion/player";
import { AbsoluteFill, Img } from "remotion";

/**
 * A simple preview composition that renders the source media with optional watermark overlay.
 * This is a client-side preview — actual rendering uses @fanslib/video compositions server-side.
 */
const PreviewComposition = ({
  sourceUrl,
  watermark,
  watermarkUrl,
}: {
  sourceUrl: string;
  watermark?: { x: number; y: number; width: number; opacity: number };
  watermarkUrl?: string;
}) => (
  <AbsoluteFill>
    <Img src={sourceUrl} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
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

  const isVideo = mediaType === "video";

  return (
    <div className="flex-1 flex items-center justify-center bg-base-300 overflow-hidden p-4">
      <Player
        component={PreviewComposition}
        inputProps={{
          sourceUrl,
          watermark: watermarkOp,
          watermarkUrl,
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
    </div>
  );
};
