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
  interactive: boolean;
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

export const CropOverlay = ({ canvasRect, interactive }: CropOverlayProps) => {
  const operations = useEditorStore((s) => s.operations);
  const cropEditingOperationIndex = useEditorStore((s) => s.cropEditingOperationIndex);
  const updateOperation = useEditorStore((s) => s.updateOperation);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const canvasRectRef = useRef<CanvasRect | null>(null);

  useEffect(() => {
    if (!dragState || cropEditingOperationIndex === null) return;

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRectRef.current;
      if (!canvas) return;
      const op = operations[cropEditingOperationIndex];
      if (!isCropOperation(op)) return;

      const dx = e.clientX - dragState.startMouseX;
      const dy = e.clientY - dragState.startMouseY;
      const relDx = dx / canvas.canvasWidth;
      const relDy = dy / canvas.canvasHeight;

      const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

      if (dragState.kind === "move") {
        const nx = clamp(
          dragState.startX + relDx,
          0,
          1 - dragState.startW,
        );
        const ny = clamp(
          dragState.startY + relDy,
          0,
          1 - dragState.startH,
        );
        updateOperation(
          cropEditingOperationIndex,
          clampCropRect({ ...op, x: nx, y: ny }),
        );
        return;
      }

      const preset = op.aspectPreset ?? "free";
      let newW = clamp(
        dragState.startW + relDx,
        MIN_CROP,
        1 - dragState.startX,
      );
      let newH = clamp(
        dragState.startH + relDy,
        MIN_CROP,
        1 - dragState.startY,
      );

      if (preset !== "free") {
        const ratio = normalizedCropAspectRatio(preset);
        newH = newW / ratio;
        if (dragState.startY + newH > 1) {
          newH = 1 - dragState.startY;
          newW = newH * ratio;
        }
        if (dragState.startX + newW > 1) {
          newW = 1 - dragState.startX;
          newH = newW / ratio;
        }
      }

      updateOperation(
        cropEditingOperationIndex,
        clampCropRect({
          ...op,
          x: dragState.startX,
          y: dragState.startY,
          width: newW,
          height: newH,
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
  }, [dragState, cropEditingOperationIndex, operations, updateOperation]);

  if (!canvasRect || !interactive) return null;
  if (cropEditingOperationIndex === null) return null;

  const op = operations[cropEditingOperationIndex];
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
