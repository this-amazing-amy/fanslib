import { OperationBlock } from "./OperationBlock";

type TrackRowProps = {
  operations: Array<{
    id: string;
    type: string;
    label?: string;
    startFrame: number;
    endFrame: number;
  }>;
  pixelsPerFrame: number;
  selectedOperationId: string | null;
  onSelectOperation: (id: string | null) => void;
  totalFrames: number;
};

export const TrackRow = ({
  operations,
  pixelsPerFrame,
  selectedOperationId,
  onSelectOperation,
  totalFrames,
}: TrackRowProps) => <div
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
          onClick={() => onSelectOperation(op.id)}
        />
      ))}
    </div>;
