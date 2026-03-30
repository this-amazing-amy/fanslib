import { useCallback, useEffect, useRef, useState } from "react";
import { useEditorStore } from "~/stores/editorStore";
import {
  relativeToPixel,
  getPlayerRect,
  type CanvasRect,
} from "../utils/coordinate-mapping";

type SpatialOp = {
  type: string;
  x: number;
  y: number;
  width: number;
  height?: number;
  [key: string]: unknown;
};

type RegionOverlayProps = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  compositionWidth?: number;
  compositionHeight?: number;
};

type DragState = {
  type: "move" | "resize";
  corner?: "nw" | "ne" | "sw" | "se";
  startMouseX: number;
  startMouseY: number;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
};

export const RegionOverlay = ({
  containerRef,
  compositionWidth = 1920,
  compositionHeight = 1080,
}: RegionOverlayProps) => {
  const operations = useEditorStore((s) => s.operations);
  const selectedIndex = useEditorStore((s) => s.selectedOperationIndex);
  const updateOperation = useEditorStore((s) => s.updateOperation);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const canvasRectRef = useRef<CanvasRect | null>(null);

  const getCanvasRect = useCallback((): CanvasRect | null => {
    const container = containerRef.current;
    if (!container) return null;
    const rect = getPlayerRect(
      container.clientWidth,
      container.clientHeight,
      compositionWidth,
      compositionHeight,
    );
    canvasRectRef.current = rect;
    return rect;
  }, [containerRef, compositionWidth, compositionHeight]);

  // Handle mouse move during drag
  useEffect(() => {
    if (!dragState || selectedIndex === null) return;

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRectRef.current;
      if (!canvas) return;

      const dx = e.clientX - dragState.startMouseX;
      const dy = e.clientY - dragState.startMouseY;
      const relDx = dx / canvas.canvasWidth;
      const relDy = dy / canvas.canvasHeight;

      const op = operations[selectedIndex] as SpatialOp;
      const clamp = (v: number) => Math.max(0, Math.min(1, v));

      if (dragState.type === "move") {
        updateOperation(selectedIndex, {
          ...op,
          x: clamp(dragState.startX + relDx),
          y: clamp(dragState.startY + relDy),
        });
      } else if (dragState.type === "resize") {
        const newWidth = clamp(dragState.startWidth + relDx);
        const newHeight = clamp(
          dragState.startHeight + relDy,
        );
        updateOperation(selectedIndex, {
          ...op,
          width: newWidth,
          height: newHeight,
        });
      }
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
  }, [dragState, selectedIndex, operations, updateOperation]);

  const canvas = getCanvasRect();
  if (!canvas) return null;

  return (
    <>
      {operations.map((op, index) => {
        const spatialOp = op as SpatialOp;
        if (typeof spatialOp.x !== "number" || typeof spatialOp.y !== "number") return null;

        const isSelected = index === selectedIndex;
        const pos = relativeToPixel(spatialOp.x, spatialOp.y, canvas);
        const width = (spatialOp.width ?? 0.1) * canvas.canvasWidth;
        const height = (spatialOp.height ?? spatialOp.width ?? 0.1) * canvas.canvasHeight;

        return (
          <div
            key={index}
            className={`absolute ${
              isSelected
                ? "border-2 border-primary cursor-move"
                : "border border-base-content/20 pointer-events-none"
            }`}
            style={{
              left: pos.px,
              top: pos.py,
              width,
              height,
            }}
            onMouseDown={
              isSelected
                ? (e) => {
                    e.preventDefault();
                    getCanvasRect();
                    setDragState({
                      type: "move",
                      startMouseX: e.clientX,
                      startMouseY: e.clientY,
                      startX: spatialOp.x,
                      startY: spatialOp.y,
                      startWidth: spatialOp.width ?? 0.1,
                      startHeight: spatialOp.height ?? spatialOp.width ?? 0.1,
                    });
                  }
                : undefined
            }
          >
            {isSelected && (
              <>
                {/* Corner resize handles */}
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
                      getCanvasRect();
                      setDragState({
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
