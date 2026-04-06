import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "~/stores/editorStore";
import {
  clampCropRect,
  isCropOperation,
  MIN_CROP,
  normalizedCropAspectRatio,
} from "../utils/crop-operation";
import { relativeToPixel, type CanvasRect } from "../utils/coordinate-mapping";

type CropOverlayProps = {
  canvasRect: CanvasRect | null;
};

type DragState =
  | {
      kind: "move";
      startMouseX: number;
      startMouseY: number;
      startX: number;
      startY: number;
      startW: number;
      startH: number;
    }
  | {
      kind: "resize-se";
      startMouseX: number;
      startMouseY: number;
      startX: number;
      startY: number;
      startW: number;
      startH: number;
    };

export const CropOverlay = ({ canvasRect }: CropOverlayProps) => {
  const operations = useEditorStore((s) => s.operations);
  const cropEditingOperationId = useEditorStore((s) => s.cropEditingOperationId);
  const updateOperationById = useEditorStore((s) => s.updateOperationById);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const canvasRectRef = useRef<CanvasRect | null>(null);

  useEffect(() => {
    if (!dragState || cropEditingOperationId === null) return;

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRectRef.current;
      if (!canvas) return;
      const op = (operations as Array<{ id?: string }>).find(
        (o) => o.id === cropEditingOperationId,
      );
      if (!isCropOperation(op)) return;

      const dx = e.clientX - dragState.startMouseX;
      const dy = e.clientY - dragState.startMouseY;
      const relDx = dx / canvas.canvasWidth;
      const relDy = dy / canvas.canvasHeight;

      const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

      if (dragState.kind === "move") {
        const nx = clamp(dragState.startX + relDx, 0, 1 - dragState.startW);
        const ny = clamp(dragState.startY + relDy, 0, 1 - dragState.startH);
        updateOperationById(cropEditingOperationId, clampCropRect({ ...op, x: nx, y: ny }));
        return;
      }

      const preset = op.aspectPreset ?? "free";
      const constrained = (() => {
        const w = clamp(dragState.startW + relDx, MIN_CROP, 1 - dragState.startX);
        const h = clamp(dragState.startH + relDy, MIN_CROP, 1 - dragState.startY);
        if (preset === "free") return { w, h };
        const ratio = normalizedCropAspectRatio(preset);
        const h1 = w / ratio;
        if (dragState.startY + h1 > 1) {
          const hClamped = 1 - dragState.startY;
          return { w: hClamped * ratio, h: hClamped };
        }
        if (dragState.startX + w > 1) {
          const wClamped = 1 - dragState.startX;
          return { w: wClamped, h: wClamped / ratio };
        }
        return { w, h: h1 };
      })();

      updateOperationById(
        cropEditingOperationId,
        clampCropRect({
          ...op,
          x: dragState.startX,
          y: dragState.startY,
          width: constrained.w,
          height: constrained.h,
        }),
      );
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragState, cropEditingOperationId, operations, updateOperationById]);

  if (!canvasRect) return null;
  if (cropEditingOperationId === null) return null;

  const op = (operations as Array<{ id?: string }>).find((o) => o.id === cropEditingOperationId);
  if (!isCropOperation(op)) return null;

  const canvas = canvasRect;
  const pos = relativeToPixel(op.x, op.y, canvas);
  const wPx = op.width * canvas.canvasWidth;
  const hPx = op.height * canvas.canvasHeight;

  return (
    <div
      className="absolute z-20 pointer-events-none"
      style={{
        left: canvas.offsetX ?? 0,
        top: canvas.offsetY ?? 0,
        width: canvas.canvasWidth,
        height: canvas.canvasHeight,
      }}
    >
      <div
        className="absolute border-2 border-white pointer-events-auto cursor-move"
        style={{
          left: pos.px,
          top: pos.py,
          width: wPx,
          height: hPx,
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          canvasRectRef.current = canvasRect;
          setDragState({
            kind: "move",
            startMouseX: e.clientX,
            startMouseY: e.clientY,
            startX: op.x,
            startY: op.y,
            startW: op.width,
            startH: op.height,
          });
        }}
      />
      <div
        className="absolute w-3 h-3 bg-white border border-base-300 rounded-sm pointer-events-auto cursor-se-resize"
        style={{
          left: pos.px + wPx - 6,
          top: pos.py + hPx - 6,
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          canvasRectRef.current = canvasRect;
          setDragState({
            kind: "resize-se",
            startMouseX: e.clientX,
            startMouseY: e.clientY,
            startX: op.x,
            startY: op.y,
            startW: op.width,
            startH: op.height,
          });
        }}
      />
    </div>
  );
};
