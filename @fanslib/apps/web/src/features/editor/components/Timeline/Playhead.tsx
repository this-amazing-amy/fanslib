import { useCallback, useRef } from "react";

type PlayheadProps = {
  currentFrame: number;
  pixelsPerFrame: number;
  totalFrames: number;
  onSeek: (frame: number) => void;
};

export const Playhead = ({
  currentFrame,
  pixelsPerFrame,
  totalFrames,
  onSeek,
}: PlayheadProps) => {
  const draggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const xToFrame = useCallback(
    (clientX: number) => {
      const rect = containerRef.current?.parentElement?.getBoundingClientRect();
      if (!rect) return 0;
      const x = clientX - rect.left;
      const frame = Math.round(x / pixelsPerFrame);
      return Math.max(0, Math.min(totalFrames, frame));
    },
    [pixelsPerFrame, totalFrames],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      draggingRef.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      onSeek(xToFrame(e.clientX));
    },
    [onSeek, xToFrame],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      onSeek(xToFrame(e.clientX));
    },
    [onSeek, xToFrame],
  );

  const handlePointerUp = useCallback(() => {
    draggingRef.current = false;
  }, []);

  const left = currentFrame * pixelsPerFrame;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-10"
    >
      <div
        className="absolute top-0 h-full w-0.5 bg-error pointer-events-auto cursor-col-resize"
        style={{ left: `${left}px` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="absolute -top-1 -left-1.5 w-3.5 h-3 bg-error rounded-b-sm" />
      </div>
    </div>
  );
};
