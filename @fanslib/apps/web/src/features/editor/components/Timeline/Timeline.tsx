import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, Trash2 } from "lucide-react";
import { useEditorStore } from "~/stores/editorStore";
import { useClipStore } from "~/stores/clipStore";
import { ClipTimeline } from "../ClipTimeline";
import { Playhead } from "./Playhead";
import { SourceMediaBar } from "./SourceMediaBar";
import { TimeRuler } from "./TimeRuler";
import { TrackHeader } from "./TrackHeader";
import { SegmentTrack } from "./SegmentTrack";
import { ExportRegionTrack } from "./ExportRegionTrack";
import { TrackRow } from "./TrackRow";
import { TransportControls } from "./TransportControls";

type TimelineProps = {
  currentFrame: number;
  totalFrames: number;
  fps: number;
  playing: boolean;
  filename?: string;
  onSeek: (frame: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
};

type ContextMenuState = {
  x: number;
  y: number;
  operationId: string;
} | null;

export const Timeline = ({
  currentFrame,
  totalFrames,
  fps,
  playing,
  filename,
  onSeek,
  onPlay,
  onPause,
  onSkipBack,
  onSkipForward,
}: TimelineProps) => {
  const clipMode = useClipStore((s) => s.clipMode);
  const clipRanges = useClipStore((s) => s.ranges);
  const showClipTimeline = clipMode || clipRanges.length > 0;
  const tracks = useEditorStore((s) => s.tracks);
  const selectedOperationId = useEditorStore((s) => s.selectedOperationId);
  const setSelectedOperationId = useEditorStore((s) => s.setSelectedOperationId);
  const addTrack = useEditorStore((s) => s.addTrack);
  const updateOperationById = useEditorStore((s) => s.updateOperationById);
  const removeOperationById = useEditorStore((s) => s.removeOperationById);
  const moveOperation = useEditorStore((s) => s.moveOperation);

  const [pixelsPerFrame, setPixelsPerFrame] = useState(2);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const wheelContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wheelContainerRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setPixelsPerFrame((prev) => prev * (e.deltaY > 0 ? 0.9 : 1.1));
      }
    };
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  const handleFitToTimeline = useCallback(() => {
    if (!scrollRef.current || totalFrames === 0) return;
    const containerWidth = scrollRef.current.clientWidth;
    setPixelsPerFrame(containerWidth / totalFrames);
  }, [totalFrames]);

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      setScrollLeft(scrollRef.current.scrollLeft);
    }
  }, []);

  const findOpById = useCallback(
    (id: string) =>
      tracks
        .flatMap(
          (t) =>
            t.operations as Array<{
              id: string;
              startFrame: number;
              endFrame: number;
            }>,
        )
        .find((o) => o.id === id),
    [tracks],
  );

  const handleMove = useCallback(
    (id: string, startFrame: number, endFrame: number) => {
      const op = findOpById(id);
      if (!op) return;
      updateOperationById(id, { ...op, startFrame, endFrame });
    },
    [findOpById, updateOperationById],
  );

  const handleTrimStart = useCallback(
    (id: string, startFrame: number) => {
      const op = findOpById(id);
      if (!op) return;
      updateOperationById(id, { ...op, startFrame });
    },
    [findOpById, updateOperationById],
  );

  const handleTrimEnd = useCallback(
    (id: string, endFrame: number) => {
      const op = findOpById(id);
      if (!op) return;
      updateOperationById(id, { ...op, endFrame });
    },
    [findOpById, updateOperationById],
  );

  const handleTrackChange = useCallback(
    (id: string, direction: string) => {
      const delta = Number(direction);
      const sourceIndex = tracks.findIndex((t) =>
        (t.operations as Array<{ id: string }>).some((op) => op.id === id),
      );
      if (sourceIndex === -1) return;
      const targetIndex = sourceIndex + delta;
      if (targetIndex < 0 || targetIndex >= tracks.length) return;
      moveOperation(id, tracks[targetIndex].id);
    },
    [moveOperation, tracks],
  );

  const handleDelete = useCallback(
    (id: string) => {
      removeOperationById(id);
      setContextMenu(null);
    },
    [removeOperationById],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, id: string) => {
      setContextMenu({ x: e.clientX, y: e.clientY, operationId: id });
      setSelectedOperationId(id);
    },
    [setSelectedOperationId],
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  return (
    <div
      data-testid="timeline"
      className="flex flex-col border-t border-base-300 bg-base-200"
      onClick={closeContextMenu}
    >
      {/* Transport bar */}
      <div className="flex items-center px-2 py-1 border-b border-base-300 bg-base-100">
        <TransportControls
          playing={playing}
          currentFrame={currentFrame}
          totalFrames={totalFrames}
          fps={fps}
          onPlay={onPlay}
          onPause={onPause}
          onSkipBack={onSkipBack}
          onSkipForward={onSkipForward}
        />
        <div className="ml-auto flex items-center gap-1">
          <button
            className="btn btn-ghost btn-xs gap-1"
            onClick={handleFitToTimeline}
            title="Fit video to timeline"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Fit
          </button>
        </div>
      </div>

      {/* Ruler + tracks area */}
      <div ref={wheelContainerRef} className="flex flex-col overflow-hidden">
        {/* Ruler row */}
        <div className="flex">
          <div className="w-32 shrink-0 border-r border-base-300" />
          <div className="overflow-hidden flex-1">
            <div style={{ marginLeft: `${-scrollLeft}px` }}>
              <TimeRuler
                pixelsPerFrame={pixelsPerFrame}
                totalFrames={totalFrames}
                fps={fps}
                scrollLeft={scrollLeft}
                onSeek={onSeek}
              />
            </div>
          </div>
        </div>

        {/* Segment track (above operation tracks) */}
        <SegmentTrack pixelsPerFrame={pixelsPerFrame} totalFrames={totalFrames} />

        {/* Export region track */}
        <ExportRegionTrack pixelsPerFrame={pixelsPerFrame} totalFrames={totalFrames} />

        {/* Tracks */}
        <div className="flex flex-1 overflow-hidden">
          {/* Track headers */}
          <div className="shrink-0">
            {tracks.map((track) => (
              <TrackHeader
                key={track.id}
                name={track.name}
                trackId={track.id}
                onAddTrack={addTrack}
              />
            ))}
          </div>

          {/* Track rows with playhead */}
          <div ref={scrollRef} className="flex-1 overflow-x-auto relative" onScroll={handleScroll}>
            <Playhead
              currentFrame={currentFrame}
              pixelsPerFrame={pixelsPerFrame}
              totalFrames={totalFrames}
              onSeek={onSeek}
            />
            {tracks.map((track) => (
              <TrackRow
                key={track.id}
                trackId={track.id}
                operations={
                  track.operations as Array<{
                    id: string;
                    type: string;
                    label?: string;
                    startFrame: number;
                    endFrame: number;
                    keyframes?: Array<{ frame: number }>;
                  }>
                }
                pixelsPerFrame={pixelsPerFrame}
                selectedOperationId={selectedOperationId}
                onSelectOperation={setSelectedOperationId}
                totalFrames={totalFrames}
                onMove={handleMove}
                onTrimStart={handleTrimStart}
                onTrimEnd={handleTrimEnd}
                onTrackChange={handleTrackChange}
                onDelete={handleDelete}
                onContextMenu={handleContextMenu}
                onSeekToFrame={onSeek}
              />
            ))}
            {filename && (
              <SourceMediaBar
                filename={filename}
                totalFrames={totalFrames}
                pixelsPerFrame={pixelsPerFrame}
              />
            )}
          </div>
        </div>
      </div>

      {showClipTimeline && (
        <ClipTimeline
          totalFrames={totalFrames}
          fps={fps}
          currentFrame={currentFrame}
          onSeek={onSeek}
        />
      )}

      {/* Context menu */}
      {contextMenu && (
        <div
          data-testid="block-context-menu"
          className="fixed z-50 bg-base-100 border border-base-300 rounded shadow-lg py-1 min-w-32"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-error hover:bg-base-200 cursor-pointer"
            onClick={() => handleDelete(contextMenu.operationId)}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
};
