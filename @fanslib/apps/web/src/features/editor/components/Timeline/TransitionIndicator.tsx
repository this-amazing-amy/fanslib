import { Diamond } from "lucide-react";

type TransitionIndicatorProps = {
  segmentId: string;
  sequenceStartFrame: number;
  durationFrames: number;
  pixelsPerFrame: number;
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
};

export const TransitionIndicator = ({
  segmentId: _segmentId,
  sequenceStartFrame,
  durationFrames,
  pixelsPerFrame,
  onClick,
  onContextMenu,
}: TransitionIndicatorProps) => {
  const width = durationFrames * pixelsPerFrame;
  const left = sequenceStartFrame * pixelsPerFrame;

  return (
    <div
      data-testid="transition-indicator"
      className="absolute h-8 flex items-center justify-center select-none cursor-pointer"
      style={{
        width: `${width}px`,
        left: `${left}px`,
        background: "linear-gradient(90deg, transparent, oklch(var(--p) / 0.4), transparent)",
      }}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <Diamond className="w-3 h-3 text-primary" />
    </div>
  );
};
