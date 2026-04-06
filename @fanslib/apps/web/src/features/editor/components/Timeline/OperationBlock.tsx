import { useCallback, useRef } from "react";
import { Crop, Droplets, Grid3x3, Image as ImageIcon, Smile, Type, ZoomIn } from "lucide-react";
import { computeMove, computeTrimEnd, computeTrimStart, detectEdge } from "./block-drag";

type OperationBlockProps = {
  id: string;
  type: string;
  label?: string;
  startFrame: number;
  endFrame: number;
  pixelsPerFrame: number;
  selected: boolean;
  totalFrames: number;
  trackId: string;
  keyframes?: Array<{ frame: number }>;
  onClick: () => void;
  onMove: (id: string, startFrame: number, endFrame: number) => void;
  onTrimStart: (id: string, startFrame: number) => void;
  onTrimEnd: (id: string, endFrame: number) => void;
  onTrackChange: (id: string, targetTrackId: string) => void;
  onDelete: (id: string) => void;
  onContextMenu?: (e: React.MouseEvent, id: string) => void;
  onSeekToFrame?: (frame: number) => void;
};

const EDGE_ZONE = 5;
const TRACK_HEIGHT = 40;

type DragMode = "move" | "trim-start" | "trim-end" | null;

type DragState = {
  mode: DragMode;
  startX: number;
  startY: number;
  originStartFrame: number;
  originEndFrame: number;
  didMove: boolean;
};

const typeConfig: Record<
  string,
  { bg: string; icon: React.ComponentType<{ className?: string }> }
> = {
  caption: { bg: "bg-primary/30 border-primary", icon: Type },
  blur: { bg: "bg-secondary/30 border-secondary", icon: Droplets },
  crop: { bg: "bg-accent/30 border-accent", icon: Crop },
  watermark: { bg: "bg-info/30 border-info", icon: ImageIcon },
  emoji: { bg: "bg-success/30 border-success", icon: Smile },
  pixelate: { bg: "bg-warning/30 border-warning", icon: Grid3x3 },
  zoom: { bg: "bg-neutral/30 border-neutral", icon: ZoomIn },
};

export const OperationBlock = ({
  id,
  type,
  label,
  startFrame,
  endFrame,
  pixelsPerFrame,
  selected,
  totalFrames,
  trackId: _trackId,
  keyframes,
  onClick,
  onMove,
  onTrimStart,
  onTrimEnd,
  onTrackChange,
  onDelete: _onDelete,
  onContextMenu,
  onSeekToFrame,
}: OperationBlockProps) => {
  const config = typeConfig[type] ?? {
    bg: "bg-base-300 border-base-content",
    icon: Type,
  };
  const Icon = config.icon;
  const width = (endFrame - startFrame) * pixelsPerFrame;
  const left = startFrame * pixelsPerFrame;

  const dragRef = useRef<DragState | null>(null);
  const elRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<string>("grab");

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const edge = detectEdge(offsetX, rect.width, EDGE_ZONE);

      const mode: DragMode =
        edge === "left" ? "trim-start" : edge === "right" ? "trim-end" : "move";

      dragRef.current = {
        mode,
        startX: e.clientX,
        startY: e.clientY,
        originStartFrame: startFrame,
        originEndFrame: endFrame,
        didMove: false,
      };

      e.currentTarget.setPointerCapture(e.pointerId);
      cursorRef.current = mode === "move" ? "grabbing" : "col-resize";
      if (elRef.current) elRef.current.style.cursor = cursorRef.current;
    },
    [startFrame, endFrame],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag) {
        // Hover cursor
        const rect = e.currentTarget.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const edge = detectEdge(offsetX, rect.width, EDGE_ZONE);
        const cursor = edge === "left" || edge === "right" ? "col-resize" : "grab";
        if (cursorRef.current !== cursor) {
          cursorRef.current = cursor;
          if (elRef.current) elRef.current.style.cursor = cursor;
        }
        return;
      }

      drag.didMove = true;
      const deltaX = e.clientX - drag.startX;
      const deltaFrames = Math.round(deltaX / pixelsPerFrame);
      const lastFrame = totalFrames;
      const range = {
        startFrame: drag.originStartFrame,
        endFrame: drag.originEndFrame,
      };

      if (drag.mode === "move") {
        const result = computeMove(range, deltaFrames, lastFrame);
        onMove(id, result.startFrame, result.endFrame);

        // Check vertical movement for track change
        const deltaY = e.clientY - drag.startY;
        if (Math.abs(deltaY) >= TRACK_HEIGHT) {
          const direction = deltaY > 0 ? 1 : -1;
          onTrackChange(id, String(direction));
          drag.startY = e.clientY;
        }
      } else if (drag.mode === "trim-start") {
        const result = computeTrimStart(range, deltaFrames, lastFrame);
        onTrimStart(id, result.startFrame);
      } else if (drag.mode === "trim-end") {
        const result = computeTrimEnd(range, deltaFrames, lastFrame);
        onTrimEnd(id, result.endFrame);
      }
    },
    [id, pixelsPerFrame, totalFrames, onMove, onTrimStart, onTrimEnd, onTrackChange],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      e.currentTarget.releasePointerCapture(e.pointerId);
      dragRef.current = null;
      cursorRef.current = "grab";
      if (elRef.current) elRef.current.style.cursor = "grab";

      if (!drag?.didMove) {
        onClick();
      }
    },
    [onClick],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onContextMenu?.(e, id);
    },
    [id, onContextMenu],
  );

  return (
    <div
      ref={elRef}
      data-testid={`operation-block-${id}`}
      className={`absolute h-8 rounded-sm border overflow-hidden whitespace-nowrap text-xs flex items-center gap-1 px-1 select-none ${config.bg}${selected ? " ring-2 ring-base-content" : ""}`}
      style={{ width: `${width}px`, left: `${left}px`, cursor: "grab" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onContextMenu={handleContextMenu}
    >
      <Icon className="w-3 h-3 shrink-0" />
      <span className="shrink-0">{type}</span>
      {type === "caption" && label && <span className="truncate opacity-70">{label}</span>}
      {selected &&
        keyframes?.map((kf, i) => (
          <div
            key={i}
            data-testid={`keyframe-diamond-${i}`}
            className="absolute w-2 h-2 rotate-45 bg-base-content cursor-pointer"
            style={{
              left: `${(kf.frame - startFrame) * pixelsPerFrame}px`,
              top: "50%",
              transform: "translate(-50%, -50%) rotate(45deg)",
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onSeekToFrame?.(kf.frame);
            }}
          />
        ))}
    </div>
  );
};
