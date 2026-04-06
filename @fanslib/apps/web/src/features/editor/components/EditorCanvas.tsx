import React, {
  useRef,
  useCallback,
  useMemo,
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
  type ReactNode,
} from "react";
import { Loader2 } from "lucide-react";
import { Player, type PlayerRef } from "@remotion/player";
import { getAvailableFonts } from "@remotion/google-fonts";
import { CaptionOverlay } from "@fanslib/video/compositions";
import type { CaptionOperation } from "@fanslib/video/types";
import { AbsoluteFill, Html5Video, Img } from "remotion";
import { shouldUseVideoElementForPreview } from "~/lib/editor-media-preview";
import { useEditorStore } from "~/stores/editorStore";
import { useRemotionCompositionViewport } from "../hooks/use-remotion-composition-viewport";
import { type CropOperation, isCropOperation } from "../utils/crop-operation";
import { CropOverlay } from "./CropOverlay";
import { RegionOverlay } from "./RegionOverlay";

const COMPOSITION_WIDTH = 1920;
const COMPOSITION_HEIGHT = 1080;

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

/** Same geometry as @fanslib/video CropFrame (normalized rect in composition space). */
const CropRectPreviewFrame = ({ crop, children }: { crop: CropOperation; children: ReactNode }) => {
  const { x, y, width: w, height: h } = crop;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: `${-(x / w) * 100}%`,
          top: `${-(y / h) * 100}%`,
          width: `${100 / w}%`,
          height: `${100 / h}%`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

const wrapWithCropChain = (crops: CropOperation[], inner: ReactNode): ReactNode =>
  crops.reduce(
    (acc, crop, i) => (
      <CropRectPreviewFrame key={`crop-${i}`} crop={crop}>
        {acc}
      </CropRectPreviewFrame>
    ),
    inner,
  );

type PreviewCompositionInputProps = {
  sourceUrl: string;
  watermark?: { x: number; y: number; width: number; opacity: number };
  watermarkUrl?: string;
  blurRegions?: BlurRegionPreview[];
  pixelateRegions?: PixelateRegionPreview[];
  emojis?: EmojiPreview[];
  crops?: CropOperation[];
  captions?: CaptionOperation[];
};

const PreviewOverlays = ({
  watermark,
  watermarkUrl,
  blurRegions = [],
  pixelateRegions = [],
  emojis = [],
  captions = [],
}: PreviewCompositionInputProps) => (
  <>
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
    {pixelateRegions.map((px, i) => {
      const ps = Math.max(2, px.pixelSize);
      const half = ps / 2;
      const filterId = `px-preview-${i}`;
      return (
        <React.Fragment key={`px-${i}`}>
          <svg style={{ position: "absolute", width: 0, height: 0 }}>
            <defs>
              <filter
                id={filterId}
                x="0%"
                y="0%"
                width="100%"
                height="100%"
                primitiveUnits="userSpaceOnUse"
              >
                <feFlood x={half} y={half} width="1" height="1" />
                <feComposite width={ps} height={ps} />
                <feTile result="grid" />
                <feComposite in="SourceGraphic" in2="grid" operator="in" />
                <feMorphology operator="dilate" radius={half} />
              </filter>
            </defs>
          </svg>
          <div
            style={{
              position: "absolute",
              left: `${px.x * 100}%`,
              top: `${px.y * 100}%`,
              width: `${px.width * 100}%`,
              height: `${px.height * 100}%`,
              backdropFilter: `url(#${filterId})`,
              WebkitBackdropFilter: `url(#${filterId})`,
              overflow: "hidden",
            }}
          />
        </React.Fragment>
      );
    })}
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
    {captions.map((cap, i) => (
      <CaptionOverlay key={`cap-${i}`} caption={cap} compositionWidth={COMPOSITION_WIDTH} />
    ))}
  </>
);

const PreviewCompositionImage = (props: PreviewCompositionInputProps) => {
  const crops = props.crops ?? [];
  const inner = (
    <>
      <Img src={props.sourceUrl} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      <PreviewOverlays {...props} />
    </>
  );
  return (
    <AbsoluteFill>{crops.length === 0 ? inner : wrapWithCropChain(crops, inner)}</AbsoluteFill>
  );
};

const PreviewCompositionVideo = (props: PreviewCompositionInputProps) => {
  const crops = props.crops ?? [];
  const inner = (
    <>
      <Html5Video
        src={props.sourceUrl}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
      <PreviewOverlays {...props} />
    </>
  );
  return (
    <AbsoluteFill>{crops.length === 0 ? inner : wrapWithCropChain(crops, inner)}</AbsoluteFill>
  );
};

type EditorCanvasProps = {
  mediaId: string;
  mediaType: "image" | "video";
  relativePath: string;
  operations: unknown[];
  /** Inclusive upper bound for frame index: `durationInFrames - 1` */
  totalFrames: number;
  /** Current preview frame (for caption overlay alignment with animations). */
  currentFrame?: number;
  onPlayerFrameChange?: (frame: number) => void;
  /** When true, transform overlays and watermark handles are hidden (clip ranges take precedence). */
  transformEditingLocked?: boolean;
};

const isWatermarkOp = (op: unknown): op is WatermarkOp =>
  typeof op === "object" &&
  op !== null &&
  "type" in op &&
  (op as { type: string }).type === "watermark";

const isCaptionOp = (op: unknown): op is CaptionOperation =>
  typeof op === "object" &&
  op !== null &&
  "type" in op &&
  (op as { type: string }).type === "caption" &&
  typeof (op as CaptionOperation).text === "string";

const toAbsoluteFileUrl = (path: string) =>
  typeof window === "undefined" ? path : new URL(path, window.location.origin).href;

const isEditableKeyTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  const { tagName } = target;
  if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") return true;
  return target.isContentEditable;
};

export type EditorCanvasHandle = {
  getPlayerRef: () => PlayerRef | null;
};

export const EditorCanvas = forwardRef<EditorCanvasHandle, EditorCanvasProps>(
  (
    {
      mediaId,
      mediaType,
      relativePath,
      operations,
      totalFrames,
      currentFrame: currentFrameProp = 0,
      onPlayerFrameChange,
      transformEditingLocked = false,
    },
    ref,
  ) => {
    const sourceUrl = useMemo(() => toAbsoluteFileUrl(`/api/media/${mediaId}/file`), [mediaId]);
    const selectedId = useEditorStore((s) => s.selectedOperationId);
    const cropEditingOperationId = useEditorStore((s) => s.cropEditingOperationId);
    const updateOperationById = useEditorStore((s) => s.updateOperationById);

    // Find watermark operation if any
    const watermarkOp = operations.find(isWatermarkOp);
    const watermarkUrl = useMemo(
      () =>
        watermarkOp ? toAbsoluteFileUrl(`/api/assets/${watermarkOp.assetId}/file`) : undefined,
      [watermarkOp],
    );

    // Collect blur operations
    const blurOps = operations.filter(
      (op): op is BlurRegionPreview & { type: "blur" } =>
        typeof op === "object" &&
        op !== null &&
        "type" in op &&
        (op as { type: string }).type === "blur",
    );

    // Collect pixelate operations
    const pixelateOps = operations.filter(
      (op): op is PixelateRegionPreview & { type: "pixelate" } =>
        typeof op === "object" &&
        op !== null &&
        "type" in op &&
        (op as { type: string }).type === "pixelate",
    );

    // Collect emoji operations
    const emojiOps = operations.filter(
      (op): op is EmojiPreview & { type: "emoji" } =>
        typeof op === "object" &&
        op !== null &&
        "type" in op &&
        (op as { type: string }).type === "emoji",
    );

    const captionOps = operations.filter(isCaptionOp);

    // Load Google Fonts for captions into the document so the Remotion Player can use them
    const captionFontFamilies = captionOps
      .map((c) => c.fontFamily)
      .filter(Boolean)
      .join(",");
    useEffect(() => {
      if (!captionFontFamilies) return;
      const fonts = getAvailableFonts();
      captionFontFamilies.split(",").forEach((family) => {
        const entry = fonts.find((f: { fontFamily: string }) => f.fontFamily === family);
        if (entry) {
          entry.load().then((loaded: { loadFont: () => void }) => loaded.loadFont());
        }
      });
    }, [captionFontFamilies]);

    const cropsForPreview = useMemo(() => {
      if (cropEditingOperationId !== null) return [];
      return operations.filter(isCropOperation).filter((c) => c.applied);
    }, [operations, cropEditingOperationId]);

    const isVideo = shouldUseVideoElementForPreview({
      type: mediaType,
      relativePath,
    });

    const playerRef = useRef<PlayerRef>(null);
    const durationInFrames = isVideo ? totalFrames : 1;
    const lastFrameIndex = Math.max(0, durationInFrames - 1);

    useImperativeHandle(
      ref,
      () => ({
        getPlayerRef: () => playerRef.current,
      }),
      [],
    );

    useEffect(() => {
      if (!isVideo || durationInFrames <= 1) return;

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        if (isEditableKeyTarget(e.target)) return;
        e.preventDefault();
        const player = playerRef.current;
        if (!player) return;
        const delta = e.key === "ArrowRight" ? 1 : -1;
        const next = Math.max(0, Math.min(lastFrameIndex, player.getCurrentFrame() + delta));
        player.seekTo(next);
        onPlayerFrameChange?.(next);
      };

      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }, [isVideo, durationInFrames, lastFrameIndex, onPlayerFrameChange]);

    // Find the selected watermark op for the draggable overlay
    const selectedOp =
      selectedId !== null
        ? (operations as Array<{ id?: string }>).find((op) => op.id === selectedId) ?? null
        : null;
    const selectedWatermark = selectedOp && isWatermarkOp(selectedOp) ? selectedOp : null;

    const playerAreaRef = useRef<HTMLDivElement>(null);

    // Track seeking state so we can overlay a spinner while the video loads the new frame
    const [isSeeking, setIsSeeking] = useState(false);
    useEffect(() => {
      if (!isVideo) return;

      const container = playerAreaRef.current;
      if (!container) return;

      const cleanup = { fn: undefined as (() => void) | undefined };

      const attachToVideo = () => {
        const video = container.querySelector("video");
        if (!video) return false;

        const onSeeking = () => setIsSeeking(true);
        const onSeeked = () => setIsSeeking(false);

        video.addEventListener("seeking", onSeeking);
        video.addEventListener("seeked", onSeeked);

        cleanup.fn = () => {
          video.removeEventListener("seeking", onSeeking);
          video.removeEventListener("seeked", onSeeked);
        };
        return true;
      };

      if (attachToVideo()) return () => cleanup.fn?.();

      // Video element may not be in the DOM yet — wait for it
      const observer = new MutationObserver(() => {
        if (attachToVideo()) observer.disconnect();
      });
      observer.observe(container, { childList: true, subtree: true });

      return () => {
        observer.disconnect();
        cleanup.fn?.();
      };
    }, [isVideo]);
    const compositionViewport = useRemotionCompositionViewport(
      playerAreaRef,
      COMPOSITION_WIDTH,
      COMPOSITION_HEIGHT,
    );
    const dragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0, opX: 0, opY: 0 });

    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        if (!selectedWatermark || selectedId === null || !compositionViewport) return;
        e.preventDefault();
        dragging.current = true;
        const viewport = compositionViewport;
        dragStart.current = {
          x: e.clientX,
          y: e.clientY,
          opX: selectedWatermark.x,
          opY: selectedWatermark.y,
        };

        const handleMouseMove = (moveEvent: MouseEvent) => {
          if (!dragging.current || selectedId === null) return;
          const dx = (moveEvent.clientX - dragStart.current.x) / viewport.canvasWidth;
          const dy = (moveEvent.clientY - dragStart.current.y) / viewport.canvasHeight;
          const w = selectedWatermark.width;
          const newX = Math.max(0, Math.min(1 - w, dragStart.current.opX + dx));
          const newY = Math.max(0, Math.min(1, dragStart.current.opY + dy));
          updateOperationById(selectedId, {
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
      [selectedWatermark, selectedId, updateOperationById, compositionViewport],
    );

    return (
      <div className="flex-1 flex items-center justify-center bg-base-300 overflow-hidden p-4 relative">
        <div
          ref={playerAreaRef}
          className="relative w-full"
          style={{ maxHeight: "100%", aspectRatio: "16/9" }}
        >
          <Player
            ref={playerRef}
            component={isVideo ? PreviewCompositionVideo : PreviewCompositionImage}
            inputProps={{
              sourceUrl,
              watermark: watermarkOp,
              watermarkUrl,
              blurRegions: blurOps,
              pixelateRegions: pixelateOps,
              emojis: emojiOps,
              crops: cropsForPreview,
              captions: captionOps,
            }}
            durationInFrames={durationInFrames}
            compositionWidth={COMPOSITION_WIDTH}
            compositionHeight={COMPOSITION_HEIGHT}
            fps={30}
            style={{
              width: "100%",
              height: "100%",
            }}
            loop={isVideo}
          />

          {isSeeking && isVideo && (
            <div className="absolute inset-0 z-[5] flex items-center justify-center bg-black/25 pointer-events-none">
              <Loader2 className="w-8 h-8 animate-spin text-white drop-shadow-md" />
            </div>
          )}

          {compositionViewport && selectedWatermark && !transformEditingLocked && (
            <div
              className="absolute z-10 pointer-events-none"
              style={{
                left: compositionViewport.offsetX ?? 0,
                top: compositionViewport.offsetY ?? 0,
                width: compositionViewport.canvasWidth,
                height: compositionViewport.canvasHeight,
              }}
            >
              <div
                onMouseDown={handleMouseDown}
                className="absolute cursor-grab border-2 border-dashed border-[rgba(59,130,246,0.8)] rounded-sm pointer-events-auto"
                style={{
                  left: `${selectedWatermark.x * 100}%`,
                  top: `${selectedWatermark.y * 100}%`,
                  width: `${selectedWatermark.width * 100}%`,
                  opacity: selectedWatermark.opacity,
                }}
              >
                <img
                  src={toAbsoluteFileUrl(`/api/assets/${selectedWatermark.assetId}/file`)}
                  alt="Watermark overlay"
                  className="w-full h-auto pointer-events-none select-none"
                  draggable={false}
                />
              </div>
            </div>
          )}
          <RegionOverlay
            canvasRect={compositionViewport}
            interactive={!transformEditingLocked}
            currentFrame={currentFrameProp}
            previewDurationInFrames={durationInFrames}
          />
          <CropOverlay canvasRect={compositionViewport} interactive={!transformEditingLocked} />
        </div>
      </div>
    );
  },
);
