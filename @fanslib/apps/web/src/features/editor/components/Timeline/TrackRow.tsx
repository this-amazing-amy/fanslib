import { OperationBlock } from "./OperationBlock";

type TrackRowProps = {
  trackId: string;
  operations: Array<{
    id: string;
    type: string;
    label?: string;
    startFrame: number;
    endFrame: number;
    keyframes?: Array<{ frame: number }>;
  }>;
  pixelsPerFrame: number;
  selectedOperationId: string | null;
  onSelectOperation: (id: string | null) => void;
  totalFrames: number;
  onMove: (id: string, startFrame: number, endFrame: number) => void;
  onTrimStart: (id: string, startFrame: number) => void;
  onTrimEnd: (id: string, endFrame: number) => void;
  onTrackChange: (id: string, targetTrackId: string) => void;
  onDelete: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onSeekToFrame?: (frame: number) => void;
};

export const TrackRow = ({
  trackId,
  operations,
  pixelsPerFrame,
  selectedOperationId,
  onSelectOperation,
  totalFrames,
  onMove,
  onTrimStart,
  onTrimEnd,
  onTrackChange,
  onDelete,
  onContextMenu,
  onSeekToFrame,
}: TrackRowProps) => (
  <div
    className="relative h-10 flex items-center"
    style={{ width: `${totalFrames * pixelsPerFrame}px` }}
    onClick={(e) => {
      if (e.target === e.currentTarget) {
        onSelectOperation(null);
      }
    }}
  >
    {operations.map((op) => (
      <OperationBlock
        key={op.id}
        id={op.id}
        type={op.type}
        label={op.label}
        startFrame={op.startFrame}
        endFrame={op.endFrame}
        pixelsPerFrame={pixelsPerFrame}
        selected={selectedOperationId === op.id}
        totalFrames={totalFrames}
        trackId={trackId}
        keyframes={op.keyframes}
        onClick={() => onSelectOperation(op.id)}
        onMove={onMove}
        onTrimStart={onTrimStart}
        onTrimEnd={onTrimEnd}
        onTrackChange={onTrackChange}
        onDelete={onDelete}
        onContextMenu={onContextMenu}
        onSeekToFrame={onSeekToFrame}
      />
    ))}
  </div>
);
