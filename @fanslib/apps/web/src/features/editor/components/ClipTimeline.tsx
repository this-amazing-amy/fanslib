import { useCallback, useEffect, useRef, useState } from "react";
import { Trash2, Scissors } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { useClipStore } from "~/stores/clipStore";

type ClipTimelineProps = {
  totalFrames: number;
  fps: number;
  currentFrame?: number;
  onSeek: (frame: number) => void;
};

const formatTime = (frame: number, fps: number): string => {
  const seconds = frame / fps;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const RANGE_COLORS = [
  "bg-primary/30 border-primary",
  "bg-secondary/30 border-secondary",
  "bg-accent/30 border-accent",
  "bg-info/30 border-info",
  "bg-success/30 border-success",
];

const formatDuration = (frames: number, fps: number): string => {
  const seconds = Math.abs(frames) / fps;
  return `${seconds.toFixed(1)}s`;
};

export const ClipTimeline = ({ totalFrames, fps, currentFrame = 0, onSeek }: ClipTimelineProps) => {
  const ranges = useClipStore((s) => s.ranges);
  const clipMode = useClipStore((s) => s.clipMode);
  const pendingMarkInFrame = useClipStore((s) => s.pendingMarkInFrame);
  const selectedRangeIndex = useClipStore((s) => s.selectedRangeIndex);
  const addRange = useClipStore((s) => s.addRange);
  const removeRange = useClipStore((s) => s.removeRange);
  const selectRange = useClipStore((s) => s.selectRange);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedRangeIndex !== null) {
        selectRange(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedRangeIndex, selectRange]);

  const frameFromEvent = useCallback(
    (e: React.MouseEvent): number => {
      const rect = timelineRef.current?.getBoundingClientRect();
      if (!rect) return 0;
      const x = e.clientX - rect.left;
      return Math.max(
        0,
        Math.min(totalFrames - 1, Math.round((x / rect.width) * (totalFrames - 1))),
      );
    },
    [totalFrames],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!clipMode) return;
      const frame = frameFromEvent(e);
      setDragStart(frame);
      setDragEnd(frame);
    },
    [clipMode, frameFromEvent],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (dragStart === null) return;
      setDragEnd(frameFromEvent(e));
    },
    [dragStart, frameFromEvent],
  );

  const handleMouseUp = useCallback(() => {
    if (dragStart !== null && dragEnd !== null && dragStart !== dragEnd) {
      const start = Math.min(dragStart, dragEnd);
      const end = Math.max(dragStart, dragEnd);
      addRange(start, end);
    }
    setDragStart(null);
    setDragEnd(null);
  }, [dragStart, dragEnd, addRange]);

  return (
    <div className="border-t border-base-300 bg-base-200/50 px-4 py-2">
      <div className="flex items-center gap-2 mb-2">
        <Scissors className="h-3 w-3 text-base-content/60" />
        <span className="text-xs font-medium text-base-content/60">
          Clip Ranges ({ranges.length})
        </span>
        {clipMode && (
          <span className="text-xs text-primary">
            Click and drag to mark a range · <kbd className="kbd kbd-xs">I</kbd> /{" "}
            <kbd className="kbd kbd-xs">O</kbd> mark in/out
          </span>
        )}
        {clipMode && pendingMarkInFrame !== null && (
          <span className="text-xs text-warning">
            In {formatTime(pendingMarkInFrame, fps)} — move playhead and press{" "}
            <kbd className="kbd kbd-xs">O</kbd>
          </span>
        )}
      </div>

      {/* Timeline bar */}
      <div
        ref={timelineRef}
        data-testid="clip-timeline-bar"
        className={`relative h-10 bg-base-300 rounded ${clipMode ? "cursor-crosshair" : "cursor-pointer"}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          if (dragStart !== null) handleMouseUp();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            selectRange(null);
          }
        }}
      >
        {/* Existing ranges */}
        {ranges.map((range, index) => {
          const left = (range.startFrame / totalFrames) * 100;
          const width = ((range.endFrame - range.startFrame) / totalFrames) * 100;
          const colorClass = RANGE_COLORS[index % RANGE_COLORS.length];
          const isSelected = selectedRangeIndex === index;

          return (
            <div
              key={`${range.startFrame}-${range.endFrame}`}
              className={`absolute top-0 bottom-0 border-2 rounded ${colorClass} ${
                isSelected ? "ring-2 ring-primary ring-offset-1" : ""
              }`}
              style={{ left: `${left}%`, width: `${width}%` }}
              onClick={(e) => {
                e.stopPropagation();
                selectRange(index);
                onSeek(range.startFrame);
              }}
            >
              <span className="absolute top-0.5 left-1 text-[10px] font-mono text-base-content/60">
                {formatTime(range.startFrame, fps)} – {formatTime(range.endFrame, fps)}
              </span>
              {range.peakFrame !== undefined &&
                (() => {
                  const rangeDuration = range.endFrame - range.startFrame;
                  const peakOffset =
                    rangeDuration > 0
                      ? ((range.peakFrame - range.startFrame) / rangeDuration) * 100
                      : 0;
                  return (
                    <div
                      data-testid={`peak-marker-${index}`}
                      className="absolute top-0 bottom-0 w-0.5 bg-error"
                      style={{ left: `${peakOffset}%` }}
                    >
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-error rotate-45" />
                    </div>
                  );
                })()}
            </div>
          );
        })}

        {/* Drag preview */}
        {dragStart !== null && dragEnd !== null && (
          <div
            className="absolute top-0 bottom-0 bg-primary/20 border border-primary border-dashed"
            style={{
              left: `${(Math.min(dragStart, dragEnd) / totalFrames) * 100}%`,
              width: `${(Math.abs(dragEnd - dragStart) / totalFrames) * 100}%`,
            }}
          />
        )}

        {/* Pending clip region (mark-in set, waiting for mark-out) */}
        {pendingMarkInFrame !== null &&
          (() => {
            const start = Math.min(pendingMarkInFrame, currentFrame);
            const end = Math.max(pendingMarkInFrame, currentFrame);
            const left = (start / totalFrames) * 100;
            const width = ((end - start) / totalFrames) * 100;
            const durationFrames = end - start;
            return (
              <div
                data-testid="pending-clip-region"
                className="absolute top-0 bottom-0 bg-warning/15 border border-warning/40 border-dashed rounded"
                style={{ left: `${left}%`, width: `${width}%` }}
              >
                <span
                  data-testid="pending-duration-flag"
                  className="absolute -top-5 right-0 text-[10px] font-mono bg-warning/80 text-warning-content px-1 rounded"
                >
                  {formatDuration(durationFrames, fps)}
                </span>
              </div>
            );
          })()}
      </div>

      {/* Range list */}
      {ranges.length > 0 && (
        <div className="mt-2 space-y-1">
          {ranges.map((range, index) => {
            const duration = range.endFrame - range.startFrame;
            const isSelected = selectedRangeIndex === index;
            return (
              <div
                key={`${range.startFrame}-${range.endFrame}`}
                className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${
                  isSelected ? "bg-base-300" : "hover:bg-base-300/50"
                } cursor-pointer`}
                onClick={() => {
                  selectRange(index);
                  onSeek(range.startFrame);
                }}
              >
                <span className="font-medium">Range {index + 1}</span>
                <span className="font-mono text-base-content/50">
                  {formatTime(range.startFrame, fps)} – {formatTime(range.endFrame, fps)}
                </span>
                <span className="text-base-content/40">({formatTime(duration, fps)})</span>
                <div className="flex-1" />
                <Button size="sm" variant="ghost" onPress={() => removeRange(index)}>
                  <Trash2 className="h-3 w-3 text-error" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
