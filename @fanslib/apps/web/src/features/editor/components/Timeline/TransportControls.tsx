import { Pause, Play, SkipBack, SkipForward } from "lucide-react";

type TransportControlsProps = {
  playing: boolean;
  currentFrame: number;
  totalFrames: number;
  fps: number;
  onPlay: () => void;
  onPause: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
};

const formatTimecode = (frame: number, fps: number): string => {
  const totalSeconds = Math.floor(frame / fps);
  const remainingFrames = frame % fps;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}:${remainingFrames.toString().padStart(2, "0")}`;
};

export const TransportControls = ({
  playing,
  currentFrame,
  totalFrames: _totalFrames,
  fps,
  onPlay,
  onPause,
  onSkipBack,
  onSkipForward,
}: TransportControlsProps) => (
  <div className="flex items-center gap-1">
    <button
      type="button"
      className="btn btn-ghost btn-xs btn-square"
      onClick={onSkipBack}
      aria-label="Skip back"
    >
      <SkipBack className="w-4 h-4" />
    </button>
    {playing ? (
      <button
        type="button"
        data-testid="transport-pause"
        className="btn btn-ghost btn-xs btn-square"
        onClick={onPause}
        aria-label="Pause"
      >
        <Pause className="w-4 h-4" />
      </button>
    ) : (
      <button
        type="button"
        data-testid="transport-play"
        className="btn btn-ghost btn-xs btn-square"
        onClick={onPlay}
        aria-label="Play"
      >
        <Play className="w-4 h-4" />
      </button>
    )}
    <button
      type="button"
      className="btn btn-ghost btn-xs btn-square"
      onClick={onSkipForward}
      aria-label="Skip forward"
    >
      <SkipForward className="w-4 h-4" />
    </button>
    <span data-testid="transport-timecode" className="font-mono text-xs tabular-nums px-2">
      {formatTimecode(currentFrame, fps)}
    </span>
  </div>
);
