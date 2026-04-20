import { Blend } from "lucide-react";
import { useEditorStore } from "~/stores/editorStore";

const EASING_OPTIONS = ["linear", "ease-in", "ease-out", "ease-in-out"] as const;

export const TransitionProperties = () => {
  const selectedTransitionSegmentId = useEditorStore((s) => s.selectedTransitionSegmentId);
  const segments = useEditorStore((s) => s.segments);
  const updateTransition = useEditorStore((s) => s.updateTransition);

  const segment = selectedTransitionSegmentId
    ? segments.find((s) => s.id === selectedTransitionSegmentId)
    : undefined;

  const transition = segment?.transition;

  if (!selectedTransitionSegmentId || !transition) {
    return null;
  }

  return (
    <div className="w-72 bg-base-100 p-4 overflow-y-auto">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
        <Blend className="w-4 h-4" />
        Crossfade
      </h3>

      <div className="space-y-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-base-content/60">
            Duration: {transition.durationFrames} frames
          </label>
          <input
            type="range"
            min={1}
            max={60}
            step={1}
            value={transition.durationFrames}
            onChange={(e) =>
              updateTransition(selectedTransitionSegmentId, {
                durationFrames: parseInt(e.target.value, 10),
              })
            }
            className="range range-xs range-primary"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-base-content/60">Easing</label>
          <select
            value={transition.easing ?? "linear"}
            onChange={(e) =>
              updateTransition(selectedTransitionSegmentId, { easing: e.target.value })
            }
            className="select select-sm select-bordered w-full bg-base-100"
          >
            {EASING_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
