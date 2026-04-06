type TimeRulerProps = {
  pixelsPerFrame: number;
  totalFrames: number;
  fps: number;
  scrollLeft: number;
  onSeek?: (frame: number) => void;
};

export const TimeRuler = ({
  pixelsPerFrame,
  totalFrames,
  fps,
  scrollLeft: _scrollLeft,
  onSeek,
}: TimeRulerProps) => {
  const totalWidth = totalFrames * pixelsPerFrame;

  // Determine tick interval based on zoom level
  const pixelsPerSecond = pixelsPerFrame * fps;
  const tickIntervalSec =
    pixelsPerSecond > 200 ? 1 : pixelsPerSecond > 50 ? 5 : pixelsPerSecond > 20 ? 10 : 30;

  const totalSeconds = totalFrames / fps;
  const tickCount = Math.floor(totalSeconds / tickIntervalSec) + 1;
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const sec = i * tickIntervalSec;
    return { sec, x: sec * fps * pixelsPerFrame };
  });

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek) return;
    const frame = Math.round(e.nativeEvent.offsetX / pixelsPerFrame);
    onSeek(Math.max(0, Math.min(totalFrames, frame)));
  };

  return (
    <div
      data-testid="time-ruler"
      className={`h-6 relative border-b border-base-300 overflow-hidden${onSeek ? " cursor-pointer select-none" : ""}`}
      style={{ width: `${totalWidth}px` }}
      onClick={handleClick}
    >
      {ticks.map((tick) => (
        <div
          key={tick.sec}
          className="absolute top-0 h-full flex flex-col items-start"
          style={{ left: `${tick.x}px` }}
        >
          <div className="w-px h-3 bg-base-content/40" />
          <span className="text-[10px] text-base-content/60 pl-0.5 leading-none">
            {formatTime(tick.sec)}
          </span>
        </div>
      ))}
    </div>
  );
};
