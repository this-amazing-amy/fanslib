import { useClipStore } from "~/stores/clipStore";

const RANGE_COLORS = [
  "bg-primary/30 border-primary",
  "bg-secondary/30 border-secondary",
  "bg-accent/30 border-accent",
  "bg-info/30 border-info",
  "bg-success/30 border-success",
];

type SourceMediaBarProps = {
  filename: string;
  totalFrames: number;
  pixelsPerFrame: number;
};

export const SourceMediaBar = ({ filename, totalFrames, pixelsPerFrame }: SourceMediaBarProps) => {
  const ranges = useClipStore((s) => s.ranges);
  const selectedRangeIndex = useClipStore((s) => s.selectedRangeIndex);
  const pendingMarkInFrame = useClipStore((s) => s.pendingMarkInFrame);
  const selectRange = useClipStore((s) => s.selectRange);

  const barWidth = totalFrames * pixelsPerFrame;

  return (
    <div
      data-testid="source-media-bar"
      className="relative h-8 shrink-0"
      style={{ width: barWidth }}
    >
      {/* Source file bar */}
      <div className="absolute inset-0 rounded bg-base-300/80 border border-base-content/10 flex items-center px-2 overflow-hidden">
        <span className="text-[10px] font-mono text-base-content/40 truncate select-none">
          {filename}
        </span>
      </div>

      {/* Clip range overlays */}
      {ranges.map((range, i) => {
        const left = range.startFrame * pixelsPerFrame;
        const width = (range.endFrame - range.startFrame) * pixelsPerFrame;
        const colorClass = RANGE_COLORS[i % RANGE_COLORS.length];
        const isSelected = selectedRangeIndex === i;

        return (
          <div
            // oxlint-disable-next-line react/no-array-index-key -- source ranges are ordered by index
            key={i}
            data-testid={`source-range-${i}`}
            className={`absolute top-0 bottom-0 border rounded cursor-pointer ${colorClass} ${
              isSelected ? "ring-2 ring-primary ring-offset-1" : ""
            }`}
            style={{ left, width }}
            onClick={(e) => {
              e.stopPropagation();
              selectRange(i);
            }}
          />
        );
      })}

      {/* Pending mark-in indicator */}
      {pendingMarkInFrame !== null && (
        <div
          data-testid="pending-mark-in"
          className="absolute top-0 bottom-0 w-px bg-warning"
          style={{ left: pendingMarkInFrame * pixelsPerFrame }}
        />
      )}
    </div>
  );
};
