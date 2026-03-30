import { Diamond, Plus, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { useEditorStore } from "~/stores/editorStore";

type KeyframeTimelineProps = {
  totalFrames: number;
  currentFrame: number;
  onSeek: (frame: number) => void;
};

type KeyframeData = {
  frame: number;
  values: Record<string, number>;
  easing?: string;
};

export const KeyframeTimeline = ({
  totalFrames,
  currentFrame,
  onSeek,
}: KeyframeTimelineProps) => {
  const operations = useEditorStore((s) => s.operations);
  const selectedIndex = useEditorStore((s) => s.selectedOperationIndex);
  const addKeyframe = useEditorStore((s) => s.addKeyframe);
  const removeKeyframe = useEditorStore((s) => s.removeKeyframe);

  if (selectedIndex === null || selectedIndex >= operations.length) {
    return null;
  }

  const selectedOp = operations[selectedIndex] as { keyframes?: KeyframeData[] };
  const keyframes = selectedOp.keyframes ?? [];

  const isAtKeyframe = keyframes.some((kf) => kf.frame === currentFrame);

  const handleAddKeyframe = () => {
    if (selectedIndex === null) return;
    addKeyframe(selectedIndex, {
      frame: currentFrame,
      values: {},
    });
  };

  const handleRemoveKeyframe = (kfIndex: number) => {
    if (selectedIndex === null) return;
    removeKeyframe(selectedIndex, kfIndex);
  };

  return (
    <div className="border-t border-base-300 bg-base-200/50 px-4 py-2">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium text-base-content/60">Keyframes</span>
        <div className="flex-1" />
        <Button
          size="sm"
          variant="ghost"
          onPress={handleAddKeyframe}
          isDisabled={isAtKeyframe}
          aria-label="Add keyframe"
        >
          <Plus className="h-3 w-3 mr-1" />
          <span className="text-xs">Add</span>
        </Button>
      </div>

      {/* Timeline bar */}
      <div className="relative h-8 bg-base-300 rounded cursor-pointer" onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const frame = Math.round((x / rect.width) * totalFrames);
        onSeek(Math.max(0, Math.min(frame, totalFrames - 1)));
      }}>
        {/* Current frame indicator */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
          style={{ left: `${(currentFrame / totalFrames) * 100}%` }}
        />

        {/* Keyframe markers */}
        {keyframes.map((kf, index) => (
          <div
            key={index}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group"
            style={{ left: `${(kf.frame / totalFrames) * 100}%` }}
          >
            <button
              className={`p-0.5 ${kf.frame === currentFrame ? "text-primary" : "text-warning"}`}
              onClick={(e) => {
                e.stopPropagation();
                onSeek(kf.frame);
              }}
            >
              <Diamond className="h-3 w-3 fill-current" />
            </button>
            <button
              className="absolute -top-4 left-1/2 -translate-x-1/2 hidden group-hover:block text-error"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveKeyframe(index);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* State indicator */}
      <div className="mt-1 text-xs text-base-content/40">
        Frame {currentFrame} · {isAtKeyframe ? "⬥ At keyframe" : "~ Interpolated"}
      </div>
    </div>
  );
};
