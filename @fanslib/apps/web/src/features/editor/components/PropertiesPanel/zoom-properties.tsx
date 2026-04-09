import type { ZoomOperation } from "@fanslib/video/types";
import { useEditorStore } from "~/stores/editorStore";
import { SliderField } from "./slider-field";

export const ZoomProperties = ({ op, opId }: { op: ZoomOperation; opId: string }) => {
  const updateOperationById = useEditorStore((s) => s.updateOperationById);
  const update = (patch: Partial<ZoomOperation>) => updateOperationById(opId, { ...op, ...patch });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-base-content/60">
          Scale: {op.scale.toFixed(2)}×
        </label>
        <input
          type="range"
          min={0.5}
          max={5}
          step={0.05}
          value={op.scale}
          onChange={(e) => update({ scale: parseFloat(e.target.value) })}
          className="range range-xs range-primary"
        />
      </div>
      <SliderField
        label="Center X"
        value={op.centerX}
        min={0}
        max={1}
        onChange={(centerX) => update({ centerX })}
      />
      <SliderField
        label="Center Y"
        value={op.centerY}
        min={0}
        max={1}
        onChange={(centerY) => update({ centerY })}
      />
    </div>
  );
};
