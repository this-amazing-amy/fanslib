import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import type { PlayerRef } from "@remotion/player";
import { useClipStore } from "~/stores/clipStore";
import { useEditorStore } from "~/stores/editorStore";

type PlaybackBarProps = {
  getPlayer: () => PlayerRef | null;
  totalFrames: number;
  fps: number;
  isVideo: boolean;
  currentFrame: number;
  onFrameChange: (frame: number) => void;
};

const formatTimecode = (frame: number, fps: number): string => {
  const totalSeconds = frame / fps;
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  const f = frame % fps;
  return `${m}:${s.toString().padStart(2, "0")}:${f.toString().padStart(2, "0")}`;
};

const RANGE_COLORS = [
  { bg: "bg-primary/20", border: "border-primary/60" },
  { bg: "bg-secondary/20", border: "border-secondary/60" },
  { bg: "bg-accent/20", border: "border-accent/60" },
  { bg: "bg-info/20", border: "border-info/60" },
  { bg: "bg-success/20", border: "border-success/60" },
];

export const PlaybackBar = ({
  getPlayer,
  totalFrames,
  fps,
  isVideo,
  currentFrame,
  onFrameChange,
}: PlaybackBarProps) => {
  const [playing, setPlaying] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const scrubbing = useRef(false);
  const animFrameRef = useRef<number>(0);

  const setSelectedOperationId = useEditorStore((s) => s.setSelectedOperationId);
  const ranges = useClipStore((s) => s.ranges);
  const pendingMarkInFrame = useClipStore((s) => s.pendingMarkInFrame);
  const selectedRangeIndex = useClipStore((s) => s.selectedRangeIndex);
  const selectRange = useClipStore((s) => s.selectRange);

  const lastFrame = Math.max(0, totalFrames - 1);
  const progress = totalFrames > 1 ? currentFrame / lastFrame : 0;

  const seekToFrame = useCallback(
    (frame: number) => {
      const clamped = Math.max(0, Math.min(lastFrame, Math.round(frame)));
      const player = getPlayer();
      if (player) player.seekTo(clamped);
      onFrameChange(clamped);
    },
    [getPlayer, lastFrame, onFrameChange],
  );

  const frameFromPointer = useCallback(
    (clientX: number) => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect) return 0;
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return Math.round(ratio * lastFrame);
    },
    [lastFrame],
  );

  const startScrub = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      trackRef.current?.setPointerCapture(e.pointerId);
      scrubbing.current = true;
      const player = getPlayer();
      if (player?.isPlaying()) {
        player.pause();
        setPlaying(false);
      }
      seekToFrame(frameFromPointer(e.clientX));
    },
    [getPlayer, seekToFrame, frameFromPointer],
  );

  const moveScrub = useCallback(
    (e: React.PointerEvent) => {
      if (!scrubbing.current) return;
      seekToFrame(frameFromPointer(e.clientX));
    },
    [seekToFrame, frameFromPointer],
  );

  const endScrub = useCallback(
    (e: React.PointerEvent) => {
      scrubbing.current = false;
      trackRef.current?.releasePointerCapture(e.pointerId);
    },
    [],
  );

  const togglePlay = useCallback(() => {
    const player = getPlayer();
    if (!player) return;
    if (player.isPlaying()) {
      player.pause();
      setPlaying(false);
    } else {
      player.play();
      setPlaying(true);
    }
  }, [getPlayer]);

  useEffect(() => {
    const poll = () => {
      const player = getPlayer();
      if (player && player.isPlaying()) {
        onFrameChange(player.getCurrentFrame());
      }
      animFrameRef.current = requestAnimationFrame(poll);
    };
    animFrameRef.current = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [getPlayer, onFrameChange]);

  useEffect(() => {
    const player = getPlayer();
    if (!player) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    return () => {
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
    };
  }, [getPlayer]);

  if (!isVideo) return null;

  return (
    <div className="h-20 border-t border-base-300 bg-base-200/80 flex flex-col select-none shrink-0">
      {/* Scrub track */}
      <div
        ref={trackRef}
        className="relative h-8 mx-3 mt-2 cursor-pointer group"
        onPointerDown={startScrub}
        onPointerMove={moveScrub}
        onPointerUp={endScrub}
      >
        {/* Track background */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 bg-base-300 rounded-full group-hover:h-2.5 transition-all" />

        {/* Clip ranges on the track */}
        {ranges.map((range, i) => {
          const left = (range.startFrame / lastFrame) * 100;
          const width = ((range.endFrame - range.startFrame) / lastFrame) * 100;
          const color = RANGE_COLORS[i % RANGE_COLORS.length];
          const isSelected = selectedRangeIndex === i;
          return (
            <div
              key={i}
              className={`absolute top-1/2 -translate-y-1/2 h-3 rounded-sm border ${color.bg} ${color.border} ${isSelected ? "ring-1 ring-primary" : ""}`}
              style={{ left: `${left}%`, width: `${width}%` }}
              onPointerDown={(e) => {
                e.stopPropagation();
                setSelectedOperationId(null);
                selectRange(i);
              }}
            />
          );
        })}

        {/* Pending mark-in indicator */}
        {pendingMarkInFrame !== null && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-warning z-10"
            style={{ left: `${(pendingMarkInFrame / lastFrame) * 100}%` }}
          >
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-mono text-warning whitespace-nowrap">
              IN
            </span>
          </div>
        )}

        {/* Progress fill */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-1.5 bg-primary rounded-full group-hover:h-2.5 transition-all"
          style={{ width: `${progress * 100}%` }}
        />

        {/* Playhead thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow-md -ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20"
          style={{ left: `${progress * 100}%` }}
        />
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-3 px-3 flex-1 min-h-0">
        {/* Transport */}
        <div className="flex items-center gap-1">
          <button
            className="p-1 rounded hover:bg-base-300 text-base-content/60 hover:text-base-content transition-colors"
            onClick={() => seekToFrame(currentFrame - 1)}
            aria-label="Previous frame"
          >
            <SkipBack className="h-3.5 w-3.5" />
          </button>
          <button
            className="p-1.5 rounded-full hover:bg-base-300 text-base-content transition-colors"
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button
            className="p-1 rounded hover:bg-base-300 text-base-content/60 hover:text-base-content transition-colors"
            onClick={() => seekToFrame(currentFrame + 1)}
            aria-label="Next frame"
          >
            <SkipForward className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Timecode */}
        <span className="font-mono text-xs text-base-content/60 tabular-nums w-24">
          {formatTimecode(currentFrame, fps)} / {formatTimecode(lastFrame, fps)}
        </span>
      </div>
    </div>
  );
};
