import { GripVertical, Eye, Trash2, Layers, Scissors, Pencil, Check } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { useEditorStore } from "~/stores/editorStore";
import { useClipStore } from "~/stores/clipStore";
import { isCropOperation } from "../utils/crop-operation";

const FPS = 30;

type LayerPanelProps = {
  onSeekFrame?: (frame: number) => void;
};

const formatClipRange = (startFrame: number, endFrame: number): string => {
  const fmt = (frame: number) => {
    const seconds = frame / FPS;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };
  return `${fmt(startFrame)}–${fmt(endFrame)}`;
};

export const LayerPanel = ({ onSeekFrame }: LayerPanelProps) => {
  const operations = useEditorStore((s) => s.operations);
  const selectedIndex = useEditorStore((s) => s.selectedOperationIndex);
  const setSelectedIndex = useEditorStore((s) => s.setSelectedOperationIndex);
  const removeOperation = useEditorStore((s) => s.removeOperation);
  const applyCrop = useEditorStore((s) => s.applyCrop);
  const cropEditingOperationIndex = useEditorStore((s) => s.cropEditingOperationIndex);
  const setCropEditingOperationIndex = useEditorStore((s) => s.setCropEditingOperationIndex);

  const clipMode = useClipStore((s) => s.clipMode);
  const ranges = useClipStore((s) => s.ranges);
  const selectedRangeIndex = useClipStore((s) => s.selectedRangeIndex);
  const selectRange = useClipStore((s) => s.selectRange);
  const removeRange = useClipStore((s) => s.removeRange);

  const hasOperations = operations.length > 0;
  const hasClips = ranges.length > 0;
  const hasClipRanges = hasClips;

  if (clipMode) {
    return (
      <div className="w-64 border-r border-base-300 bg-base-200/30 p-2 overflow-y-auto flex flex-col">
        <h3 className="text-sm font-semibold px-2 py-1 mb-1 flex items-center gap-1.5">
          <Scissors className="h-3.5 w-3.5 text-primary" />
          Clips
        </h3>
        <div className="space-y-1 flex-1">
          {hasClips ? (
            ranges.map((range, index) => {
              const isSelected = selectedRangeIndex === index;

              return (
                <div
                  key={`clip-${index}`}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer text-sm ${
                    isSelected
                      ? "bg-base-300 text-base-content"
                      : "text-base-content/70 hover:bg-base-300/50"
                  }`}
                  onClick={() => {
                    setSelectedIndex(null);
                    if (isSelected) {
                      selectRange(null);
                    } else {
                      selectRange(index);
                      onSeekFrame?.(range.startFrame);
                    }
                  }}
                >
                  <Scissors className="h-3 w-3 text-primary" />
                  <span className="flex-1 truncate font-mono text-xs">
                    Clip {index + 1} · {formatClipRange(range.startFrame, range.endFrame)}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onPress={() => {
                      removeRange(index);
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-error" />
                  </Button>
                </div>
              );
            })
          ) : (
            <p className="px-2 py-2 text-xs text-base-content/40 leading-snug">
              Mark in/out or drag on the timeline to add clip ranges.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!hasOperations && !hasClipRanges) {
    return (
      <div className="w-64 border-r border-base-300 bg-base-200/30 p-4 flex flex-col items-center justify-center text-base-content/40">
        <Layers className="h-8 w-8 mb-2" />
        <p className="text-sm text-center">No operations yet</p>
        <p className="text-xs text-center">Add a tool from the toolbar to get started</p>
      </div>
    );
  }

  return (
    <div className="w-64 border-r border-base-300 bg-base-200/30 p-2 overflow-y-auto">
      <h3 className="text-sm font-semibold px-2 py-1 mb-1">Layers</h3>
      <div className="space-y-1">
        {hasClipRanges ? (
          <p className="px-2 py-2 text-xs text-base-content/50 leading-snug">
            Transform layers are hidden while clip ranges exist. Remove all clips to edit them.
          </p>
        ) : hasOperations ? (
          operations.map((op, index) => {
            const opObj = op as { type?: string };
            const label = opObj.type ?? `Operation ${index + 1}`;
            const isSelected = selectedIndex === index && selectedRangeIndex === null;
            const crop = isCropOperation(op) ? op : null;
            const showCropEdit =
              crop?.applied === true && cropEditingOperationIndex !== index;
            const showCropApply =
              crop &&
              (!crop.applied || cropEditingOperationIndex === index);

            return (
              <div
                key={`op-${index}`}
                className={`flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer text-sm ${
                  isSelected
                    ? "bg-base-300 text-base-content"
                    : "text-base-content/70 hover:bg-base-300/50"
                }`}
                onClick={() => {
                  selectRange(null);
                  setSelectedIndex(isSelected ? null : index);
                }}
              >
                <GripVertical className="h-3 w-3 text-base-content/30 cursor-grab" />
                <span className="flex-1 truncate capitalize">{label}</span>
                <Eye className="h-3 w-3 text-base-content/30" />
                {showCropEdit && (
                  <div
                    className="inline-flex"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label="Edit crop"
                      onPress={() => setCropEditingOperationIndex(index)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                {showCropApply && (
                  <div
                    className="inline-flex"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Button
                      size="sm"
                      variant="primary"
                      aria-label="Apply crop"
                      onPress={() => applyCrop(index)}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <div
                  className="inline-flex"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    onPress={() => removeOperation(index)}
                  >
                    <Trash2 className="h-3 w-3 text-error" />
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="px-2 py-1 text-xs text-base-content/40">No transform layers</p>
        )}
      </div>
    </div>
  );
};
