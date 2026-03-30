import { useRef, useCallback } from "react";
import { Player } from "@remotion/player";
import { AbsoluteFill, Img } from "remotion";
import { useEditorStore } from "~/stores/editorStore";
import { RegionOverlay } from "./RegionOverlay";

type WatermarkOp = {
  type: "watermark";
  assetId: string;
  x: number;
  y: number;
  width: number;
  opacity: number;
};

/**
 * A simple preview composition that renders the source media with optional watermark overlay.
 * This is a client-side preview -- actual rendering uses @fanslib/video compositions server-side.
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

const isWatermarkOp = (op: unknown): op is WatermarkOp =>
  typeof op === "object" &&
  op !== null &&
  "type" in op &&
  (op as { type: string }).type === "watermark";

export const EditorCanvas = ({ mediaId, mediaType, operations }: EditorCanvasProps) => {
  const sourceUrl = `/api/media/${mediaId}/file`;
  const selectedIndex = useEditorStore((s) => s.selectedOperationIndex);
  const updateOperation = useEditorStore((s) => s.updateOperation);

  // Find watermark operation if any
  const watermarkOp = operations.find(isWatermarkOp);
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

  // Find the selected watermark op for the draggable overlay
  const selectedOp = selectedIndex !== null && selectedIndex < operations.length
    ? operations[selectedIndex]
    : null;
  const selectedWatermark = selectedOp && isWatermarkOp(selectedOp) ? selectedOp : null;

  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, opX: 0, opY: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!selectedWatermark || selectedIndex === null) return;
      e.preventDefault();
      dragging.current = true;
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        opX: selectedWatermark.x,
        opY: selectedWatermark.y,
      };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!dragging.current || !containerRef.current || selectedIndex === null) return;
        const rect = containerRef.current.getBoundingClientRect();
        const dx = (moveEvent.clientX - dragStart.current.x) / rect.width;
        const dy = (moveEvent.clientY - dragStart.current.y) / rect.height;
        const newX = Math.max(0, Math.min(1, dragStart.current.opX + dx));
        const newY = Math.max(0, Math.min(1, dragStart.current.opY + dy));
        updateOperation(selectedIndex, {
          ...selectedWatermark,
          x: newX,
          y: newY,
        });
      };

      const handleMouseUp = () => {
        dragging.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [selectedWatermark, selectedIndex, updateOperation],
  );

  return (
    <div ref={containerRef} className="flex-1 flex items-center justify-center bg-base-300 overflow-hidden p-4 relative">
      <div className="relative w-full" style={{ maxHeight: "100%", aspectRatio: "16/9" }}>
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
            height: "100%",
          }}
          controls={isVideo}
          loop={isVideo}
        />

        {/* Draggable watermark overlay when a watermark is selected */}
        {selectedWatermark && (
          <div
            onMouseDown={handleMouseDown}
            style={{
              position: "absolute",
              left: `${selectedWatermark.x * 100}%`,
              top: `${selectedWatermark.y * 100}%`,
              width: `${selectedWatermark.width * 100}%`,
              opacity: selectedWatermark.opacity,
              cursor: "grab",
              border: "2px dashed rgba(59, 130, 246, 0.8)",
              borderRadius: "2px",
              pointerEvents: "auto",
              zIndex: 10,
            }}
          >
            <img
              src={`/api/assets/${selectedWatermark.assetId}/file`}
              alt="Watermark overlay"
              className="w-full h-auto pointer-events-none select-none"
              draggable={false}
            />
          </div>
        )}
      </div>
      <RegionOverlay containerRef={containerRef} />
    </div>
  );
};
