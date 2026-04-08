import { useCallback, useState } from "react";
import { Film, Trash2 } from "lucide-react";
import { useEditorStore } from "~/stores/editorStore";
import { computeSequenceTimeline } from "~/features/editor/utils/sequence-engine";

type SegmentTrackProps = {
  pixelsPerFrame: number;
  totalFrames: number;
};

type ContextMenuState = {
  x: number;
  y: number;
  segmentId: string;
} | null;

export const SegmentTrack = ({ pixelsPerFrame, totalFrames }: SegmentTrackProps) => {
  const segments = useEditorStore((s) => s.segments);
  const selectedSegmentId = useEditorStore((s) => s.selectedSegmentId);
  const selectSegment = useEditorStore((s) => s.selectSegment);
  const removeSegment = useEditorStore((s) => s.removeSegment);

  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);

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
                className={`absolute h-8 rounded-sm border overflow-hidden whitespace-nowrap text-xs flex items-center gap-1 px-1 select-none bg-info/30 border-info${selected ? " ring-2 ring-base-content" : ""}`}
                style={{ width: `${width}px`, left: `${left}px`, cursor: "pointer" }}
                onClick={() => selectSegment(pos.segmentId)}
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
