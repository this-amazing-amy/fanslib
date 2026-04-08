import React, {
  useRef,
  useCallback,
  useMemo,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import { Loader2 } from "lucide-react";
import { Player, type PlayerRef } from "@remotion/player";
import { getAvailableFonts } from "@remotion/google-fonts";
import { shouldUseVideoElementForPreview } from "~/lib/editor-media-preview";
import { useEditorStore } from "~/stores/editorStore";
import { useRemotionCompositionViewport } from "../../hooks/use-remotion-composition-viewport";
import { isCropOperation } from "../../utils/crop-operation";
import { CropOverlay } from "../CropOverlay";
import { RegionOverlay } from "../RegionOverlay";
import {
  isWatermarkOp,
  isCaptionOp,
  toAbsoluteFileUrl,
  isEditableKeyTarget,
} from "./helpers";
import type { BlurRegionPreview, PixelateRegionPreview, EmojiPreview } from "./preview-composition";
import { PreviewCompositionVideo, PreviewCompositionImage } from "./preview-composition";
import { useVideoSeekingState } from "./use-video-seeking-state";

const DEFAULT_COMPOSITION_WIDTH = 1920;
const DEFAULT_COMPOSITION_HEIGHT = 1080;

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
  playing?: boolean;
  compositionWidth?: number;
  compositionHeight?: number;
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
      playing: isPlaying = false,
      compositionWidth: compositionWidthProp,
      compositionHeight: compositionHeightProp,
    },
    ref,
  ) => {
    const COMPOSITION_WIDTH = compositionWidthProp ?? DEFAULT_COMPOSITION_WIDTH;
    const COMPOSITION_HEIGHT = compositionHeightProp ?? DEFAULT_COMPOSITION_HEIGHT;

    const sourceUrl = useMemo(() => toAbsoluteFileUrl(`/api/media/${mediaId}/file`), [mediaId]);
    const selectedId = useEditorStore((s) => s.selectedOperationId);
    const cropEditingOperationId = useEditorStore((s) => s.cropEditingOperationId);
    const updateOperationById = useEditorStore((s) => s.updateOperationById);

    // Find watermark operation if any
    const watermarkOp = useMemo(() => operations.find(isWatermarkOp), [operations]);
    const watermarkUrl = useMemo(
      () =>
        watermarkOp ? toAbsoluteFileUrl(`/api/assets/${watermarkOp.assetId}/file`) : undefined,
      [watermarkOp],
    );

    // Collect operations by type
    const blurOps = useMemo(
      () =>
        operations.filter(
          (op): op is BlurRegionPreview & { type: "blur" } =>
            typeof op === "object" &&
            op !== null &&
            "type" in op &&
            (op as { type: string }).type === "blur",
        ),
      [operations],
    );

    const pixelateOps = useMemo(
      () =>
        operations.filter(
          (op): op is PixelateRegionPreview & { type: "pixelate" } =>
            typeof op === "object" &&
            op !== null &&
            "type" in op &&
            (op as { type: string }).type === "pixelate",
        ),
      [operations],
    );

    const emojiOps = useMemo(
      () =>
        operations.filter(
          (op): op is EmojiPreview & { type: "emoji" } =>
            typeof op === "object" &&
            op !== null &&
            "type" in op &&
            (op as { type: string }).type === "emoji",
        ),
      [operations],
    );

    const captionOps = useMemo(() => operations.filter(isCaptionOp), [operations]);

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

    // Forward Remotion player frame updates during playback
    useEffect(() => {
      const player = playerRef.current;
      if (!player || !isVideo) return;
      const handler = () => {
        onPlayerFrameChange?.(player.getCurrentFrame());
      };
      player.addEventListener("frameupdate", handler);
      return () => player.removeEventListener("frameupdate", handler);
    }, [isVideo, onPlayerFrameChange]);

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
        ? ((operations as Array<{ id?: string }>).find((op) => op.id === selectedId) ?? null)
        : null;
    const selectedWatermark = selectedOp && isWatermarkOp(selectedOp) ? selectedOp : null;

    const playerAreaRef = useRef<HTMLDivElement>(null);
    const isSeeking = useVideoSeekingState(playerAreaRef, isVideo);

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

    const playerInputProps = useMemo(
      () => ({
        sourceUrl,
        watermark: watermarkOp,
        watermarkUrl,
        blurRegions: blurOps,
        pixelateRegions: pixelateOps,
        emojis: emojiOps,
        crops: cropsForPreview,
        captions: captionOps,
        compositionWidth: COMPOSITION_WIDTH,
      }),
      [sourceUrl, watermarkOp, watermarkUrl, blurOps, pixelateOps, emojiOps, cropsForPreview, captionOps, COMPOSITION_WIDTH],
    );
    const playerStyle = useMemo(() => ({ width: "100%" as const, height: "100%" as const }), []);

    return (
      <div
        className="flex-1 flex items-center justify-center bg-base-300 overflow-hidden p-4 relative"
        onClick={(e) => {
          // Deselect when clicking background area (gray padding or empty composition space)
          const target = e.target as HTMLElement;
          // Don't deselect if clicking an overlay border, handle, or interactive element
          if (target.closest("[data-overlay]")) return;
          useEditorStore.getState().setSelectedOperationId(null);
          useEditorStore.getState().setCropEditingOperationId(null);
        }}
      >
        <div
          ref={playerAreaRef}
          className="relative w-full"
          style={{ maxHeight: "100%", aspectRatio: `${COMPOSITION_WIDTH}/${COMPOSITION_HEIGHT}` }}
        >
          <Player
            ref={playerRef}
            acknowledgeRemotionLicense
            component={isVideo ? PreviewCompositionVideo : PreviewCompositionImage}
            inputProps={playerInputProps}
            durationInFrames={durationInFrames}
            compositionWidth={COMPOSITION_WIDTH}
            compositionHeight={COMPOSITION_HEIGHT}
            fps={30}
            style={playerStyle}
            loop={isVideo}
          />

          {isSeeking && isVideo && !isPlaying && (
            <div className="absolute inset-0 z-[5] flex items-center justify-center bg-black/25 pointer-events-none">
              <Loader2 className="w-8 h-8 animate-spin text-white drop-shadow-md" />
            </div>
          )}

          {compositionViewport && selectedWatermark && (
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
                data-overlay
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
            currentFrame={currentFrameProp}
            previewDurationInFrames={durationInFrames}
          />
          <CropOverlay canvasRect={compositionViewport} />
        </div>
      </div>
    );
  },
);
