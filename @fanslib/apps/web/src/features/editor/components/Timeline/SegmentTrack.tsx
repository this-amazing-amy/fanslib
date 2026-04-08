import { useCallback, useRef, useState } from "react";
import { Film, Trash2 } from "lucide-react";
import { useEditorStore } from "~/stores/editorStore";
import { computeSequenceTimeline } from "~/features/editor/utils/sequence-engine";
import { detectEdge } from "./block-drag";
import { computeSegmentReorderIndex, computeSegmentTrimStart, computeSegmentTrimEnd } from "./segment-drag";

const EDGE_ZONE = 8;

type SegmentTrackProps = {
  pixelsPerFrame: number;
  totalFrames: number;
};

type ContextMenuState = {
  x: number;
  y: number;
  segmentId: string;
} | null;

type SegmentDragMode = "reorder" | "trim-start" | "trim-end" | null;

type SegmentDragState = {
  mode: SegmentDragMode;
  segmentId: string;
  startX: number;
  didMove: boolean;
};

export const SegmentTrack = ({ pixelsPerFrame, totalFrames }: SegmentTrackProps) => {
  const segments = useEditorStore((s) => s.segments);
  const selectedSegmentId = useEditorStore((s) => s.selectedSegmentId);
  const selectSegment = useEditorStore((s) => s.selectSegment);
  const removeSegment = useEditorStore((s) => s.removeSegment);
  const reorderSegments = useEditorStore((s) => s.reorderSegments);
  const trimSegmentStart = useEditorStore((s) => s.trimSegmentStart);
  const trimSegmentEnd = useEditorStore((s) => s.trimSegmentEnd);

  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const dragRef = useRef<SegmentDragState | null>(null);
  const blockRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const timeline = computeSequenceTimeline(segments);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, segmentId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, segmentId });
    },
    [],
  );

  const handleDelete = useCallback(
    (segmentId: string) => {
      removeSegment(segmentId);
      setContextMenu(null);
    },
    [removeSegment],
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleSegmentPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, segmentId: string) => {
      if (e.button !== 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const edge = detectEdge(offsetX, rect.width, EDGE_ZONE);

      const mode: SegmentDragMode =
        edge === "left" ? "trim-start" : edge === "right" ? "trim-end" : "reorder";

      dragRef.current = {
        mode,
        segmentId,
        startX: e.clientX,
        didMove: false,
      };

      e.currentTarget.setPointerCapture?.(e.pointerId);
      e.currentTarget.style.cursor = mode === "reorder" ? "grabbing" : "col-resize";
    },
    [],
  );

  const handleSegmentPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag) {
        // Hover cursor
        const rect = e.currentTarget.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const edge = detectEdge(offsetX, rect.width, EDGE_ZONE);
        e.currentTarget.style.cursor = edge === "left" || edge === "right" ? "col-resize" : "grab";
        return;
      }

      drag.didMove = true;
      const deltaX = e.clientX - drag.startX;
      const deltaFrames = Math.round(deltaX / pixelsPerFrame);

      if (drag.mode === "reorder") {
        const currentTimeline = computeSequenceTimeline(segments);
        const newIndex = computeSegmentReorderIndex(
          segments,
          drag.segmentId,
          e.clientX - (e.currentTarget.closest("[data-testid='segment-track-row']") as HTMLElement | null)?.getBoundingClientRect().left!,
          pixelsPerFrame,
          currentTimeline,
        );
        reorderSegments(drag.segmentId, newIndex);
      } else {
        const segment = segments.find((s) => s.id === drag.segmentId);
        if (!segment) return;

        if (drag.mode === "trim-start") {
          const { sourceStartFrame } = computeSegmentTrimStart(segment, deltaFrames);
          trimSegmentStart(drag.segmentId, sourceStartFrame);
        } else if (drag.mode === "trim-end") {
          const { sourceEndFrame } = computeSegmentTrimEnd(segment, deltaFrames);
          trimSegmentEnd(drag.segmentId, sourceEndFrame);
        }
        // Update startX so delta is incremental
        drag.startX = e.clientX;
      }
    },
    [pixelsPerFrame, segments, reorderSegments, trimSegmentStart, trimSegmentEnd],
  );

  const handleSegmentPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      e.currentTarget.releasePointerCapture?.(e.pointerId);
      e.currentTarget.style.cursor = "grab";
      dragRef.current = null;

      if (!drag?.didMove) {
        selectSegment(drag?.segmentId ?? null);
      }
    },
    [selectSegment],
  );

  if (segments.length === 0) return null;

  return (
    <>
      {/* Track header + row wrapper */}
      <div className="flex" onClick={closeContextMenu}>
        {/* Header */}
        <div className="w-32 h-10 flex items-center px-2 border-r border-base-300 shrink-0">
          <Film className="w-3 h-3 mr-1 shrink-0" />
          <span className="text-xs truncate">Video</span>
        </div>

        {/* Track row */}
        <div
          data-testid="segment-track-row"
          className="relative h-10 flex items-center flex-1"
          style={{ width: `${totalFrames * pixelsPerFrame}px` }}
        >
          {timeline.positions.map((pos) => {
            const segment = segments.find((s) => s.id === pos.segmentId);
            if (!segment) return null;

            const width = (pos.sequenceEndFrame - pos.sequenceStartFrame) * pixelsPerFrame;
            const left = pos.sequenceStartFrame * pixelsPerFrame;
            const selected = selectedSegmentId === pos.segmentId;

            return (
              <div
                key={pos.segmentId}
                data-testid="segment-block"
                ref={(el) => {
                  if (el) blockRefs.current.set(pos.segmentId, el);
                  else blockRefs.current.delete(pos.segmentId);
                }}
                className={`absolute h-8 rounded-sm border overflow-hidden whitespace-nowrap text-xs flex items-center gap-1 px-1 select-none bg-info/30 border-info${selected ? " ring-2 ring-base-content" : ""}`}
                style={{ width: `${width}px`, left: `${left}px`, cursor: "grab" }}
                onPointerDown={(e) => handleSegmentPointerDown(e, pos.segmentId)}
                onPointerMove={handleSegmentPointerMove}
                onPointerUp={handleSegmentPointerUp}
                onContextMenu={(e) => handleContextMenu(e, pos.segmentId)}
              >
                <Film className="w-3 h-3 shrink-0" />
                <span className="truncate">{segment.sourceMediaId}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          data-testid="segment-context-menu"
          className="fixed z-50 bg-base-100 border border-base-300 rounded shadow-lg py-1 min-w-32"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            data-testid="segment-delete-btn"
            className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-error hover:bg-base-200 cursor-pointer"
            onClick={() => handleDelete(contextMenu.segmentId)}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      )}
    </>
  );
};
