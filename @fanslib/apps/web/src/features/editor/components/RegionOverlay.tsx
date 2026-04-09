import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "~/stores/editorStore";
import {
  captionAnimationViewportOffsetPx,
  captionHalfNormFromBox,
  isCaptionOperation,
  measureCaptionBoxPx,
} from "../utils/caption-layout";
import { relativeToPixel, type CanvasRect } from "../utils/coordinate-mapping";

type SpatialOp = {
  type: string;
  x: number;
  y: number;
  width: number;
  height?: number;
  [key: string]: unknown;
};

type RegionOverlayProps = {
  canvasRect: CanvasRect | null;
  /** Matches Remotion preview frame for caption animation alignment. */
  currentFrame?: number;
  /** Same as Player `durationInFrames` (1 for still preview). */
  previewDurationInFrames?: number;
};

type DragState =
  | {
      kind: "spatial";
      type: "move" | "resize";
      corner?: "nw" | "ne" | "sw" | "se";
      startMouseX: number;
      startMouseY: number;
      startX: number;
      startY: number;
      startWidth: number;
      startHeight: number;
    }
  | {
      kind: "caption-move";
      startMouseX: number;
      startMouseY: number;
      startX: number;
      startY: number;
      halfWNorm: number;
      halfHNorm: number;
    };

export const RegionOverlay = ({
  canvasRect,
  currentFrame = 0,
  previewDurationInFrames = 1,
}: RegionOverlayProps) => {
  const operations = useEditorStore((s) => s.operations);
  const selectedId = useEditorStore((s) => s.selectedOperationId);
  const updateOperationById = useEditorStore((s) => s.updateOperationById);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const canvasRectRef = useRef<CanvasRect | null>(null);

  useEffect(() => {
    if (!dragState || selectedId === null) return;

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRectRef.current;
      if (!canvas) return;

      const raw = operations.find((op) => op.id === selectedId);
      if (!raw) return;
      const op = raw as SpatialOp;
      const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

      const dx = e.clientX - dragState.startMouseX;
      const dy = e.clientY - dragState.startMouseY;
      const relDx = dx / canvas.canvasWidth;
      const relDy = dy / canvas.canvasHeight;

      if (dragState.kind === "caption-move") {
        if (!isCaptionOperation(raw)) return;
        const cap = raw;
        const nx = clamp(dragState.startX + relDx, dragState.halfWNorm, 1 - dragState.halfWNorm);
        const ny = clamp(dragState.startY + relDy, dragState.halfHNorm, 1 - dragState.halfHNorm);
        updateOperationById(selectedId, { ...cap, x: nx, y: ny });
        return;
      }

      const clamp01 = (v: number, max = 1) => Math.max(0, Math.min(max, v));
      const opW = dragState.startWidth;
      const opH = dragState.startHeight;
      const isEmoji = op.type === "emoji";

      if (dragState.type === "move") {
        const nx = dragState.startX + relDx;
        const ny = dragState.startY + relDy;
        updateOperationById(selectedId, {
          ...op,
          x: isEmoji ? Math.max(opW / 2, Math.min(1 - opW / 2, nx)) : clamp01(nx, 1 - opW),
          y: isEmoji ? Math.max(opH / 2, Math.min(1 - opH / 2, ny)) : clamp01(ny, 1 - opH),
        });
        return;
      }

      const corner = dragState.corner ?? "se";
      let newX = dragState.startX;
      let newY = dragState.startY;
      let newWidth = dragState.startWidth;
      let newHeight = dragState.startHeight;

      if (corner.endsWith("e")) {
        newWidth = clamp01(dragState.startWidth + relDx, 1 - dragState.startX);
      } else {
        // West corners: move x and shrink width
        newX = clamp01(dragState.startX + relDx);
        newWidth = clamp01(dragState.startWidth - relDx);
      }

      if (corner.startsWith("s")) {
        newHeight = clamp01(dragState.startHeight + relDy, 1 - dragState.startY);
      } else {
        // North corners: move y and shrink height
        newY = clamp01(dragState.startY + relDy);
        newHeight = clamp01(dragState.startHeight - relDy);
      }

      updateOperationById(selectedId, {
        ...op,
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      });
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragState, selectedId, operations, updateOperationById]);

  if (!canvasRect) return null;

  const canvas = canvasRect;

  return (
    <>
      {operations.map((op, index) => {
        const spatialOp = op as SpatialOp;
        if (spatialOp.type === "crop") return null;
        if (typeof spatialOp.x !== "number" || typeof spatialOp.y !== "number") return null;

        const opId = op.id;
        const isSelected = opId != null && opId === selectedId;

        if (isCaptionOperation(op)) {
          const caption = op;
          const captionVisible =
            previewDurationInFrames <= 1 ||
            (currentFrame >= caption.startFrame && currentFrame <= caption.endFrame);
          if (!captionVisible) return null;

          const { widthPx, heightPx } = measureCaptionBoxPx(caption, canvas.canvasWidth);
          const { dx, dy } = captionAnimationViewportOffsetPx(
            caption,
            currentFrame,
            canvas.canvasHeight,
            previewDurationInFrames,
          );
          const center = relativeToPixel(caption.x, caption.y, canvas);
          const left = center.px - widthPx / 2 + dx;
          const top = center.py - heightPx / 2 + dy;
          const { halfWNorm, halfHNorm } = captionHalfNormFromBox(
            widthPx,
            heightPx,
            canvas.canvasWidth,
            canvas.canvasHeight,
          );

          return (
            <div
              key={index}
              className={`absolute ${
                isSelected ? "border-2 border-primary cursor-move" : "pointer-events-none"
              }`}
              style={{
                left,
                top,
                width: widthPx,
                height: heightPx,
              }}
              onMouseDown={
                isSelected
                  ? (e) => {
                      e.preventDefault();
                      canvasRectRef.current = canvasRect;
                      setDragState({
                        kind: "caption-move",
                        startMouseX: e.clientX,
                        startMouseY: e.clientY,
                        startX: caption.x,
                        startY: caption.y,
                        halfWNorm,
                        halfHNorm,
                      });
                    }
                  : undefined
              }
            />
          );
        }

        const pos = relativeToPixel(spatialOp.x, spatialOp.y, canvas);
        const isEmoji = spatialOp.type === "emoji";
        const emojiSize = isEmoji
          ? (((spatialOp as Record<string, unknown>).size as number) ?? 0.1)
          : 0;
        const width = isEmoji
          ? emojiSize * canvas.canvasWidth
          : (spatialOp.width ?? 0.1) * canvas.canvasWidth;
        const height = isEmoji
          ? emojiSize * canvas.canvasHeight
          : (spatialOp.height ?? spatialOp.width ?? 0.1) * canvas.canvasHeight;

        return (
          <div
            key={index}
            className={`absolute ${
              isSelected ? "border-2 border-primary cursor-move" : "pointer-events-none"
            }`}
            style={{
              left: isEmoji ? pos.px - width / 2 : pos.px,
              top: isEmoji ? pos.py - height / 2 : pos.py,
              width,
              height,
            }}
            onMouseDown={
              isSelected
                ? (e) => {
                    e.preventDefault();
                    canvasRectRef.current = canvasRect;
                    setDragState({
                      kind: "spatial",
                      type: "move",
                      startMouseX: e.clientX,
                      startMouseY: e.clientY,
                      startX: spatialOp.x,
                      startY: spatialOp.y,
                      startWidth: isEmoji ? emojiSize : (spatialOp.width ?? 0.1),
                      startHeight: isEmoji
                        ? emojiSize
                        : (spatialOp.height ?? spatialOp.width ?? 0.1),
                    });
                  }
                : undefined
            }
          >
            {isSelected && !isEmoji && (
              <>
                {(["nw", "ne", "sw", "se"] as const).map((corner) => (
                  <div
                    key={corner}
                    className="absolute w-2 h-2 bg-primary border border-base-100 rounded-sm cursor-nwse-resize"
                    style={{
                      top: corner.startsWith("n") ? -4 : undefined,
                      bottom: corner.startsWith("s") ? -4 : undefined,
                      left: corner.endsWith("w") ? -4 : undefined,
                      right: corner.endsWith("e") ? -4 : undefined,
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      canvasRectRef.current = canvasRect;
                      setDragState({
                        kind: "spatial",
                        type: "resize",
                        corner,
                        startMouseX: e.clientX,
                        startMouseY: e.clientY,
                        startX: spatialOp.x,
                        startY: spatialOp.y,
                        startWidth: spatialOp.width ?? 0.1,
                        startHeight: spatialOp.height ?? spatialOp.width ?? 0.1,
                      });
                    }}
                  />
                ))}
              </>
            )}
          </div>
        );
      })}
    </>
  );
};
