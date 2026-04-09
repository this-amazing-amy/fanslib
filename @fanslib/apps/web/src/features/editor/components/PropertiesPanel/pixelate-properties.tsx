import type { PixelateOperation } from "@fanslib/video/types";
import { useEditorStore } from "~/stores/editorStore";
import { SliderField } from "./slider-field";

export const PixelateProperties = ({ op, opId }: { op: PixelateOperation; opId: string }) => {
  const updateOperationById = useEditorStore((s) => s.updateOperationById);
  const update = (patch: Partial<PixelateOperation>) =>
    updateOperationById(opId, { ...op, ...patch });

  return (
    <div className="space-y-4">
      <SliderField
        label="X"
        value={op.x}
        min={0}
        max={1 - op.width}
        onChange={(x) => update({ x })}
      />
      <SliderField
        label="Y"
        value={op.y}
        min={0}
        max={1 - op.height}
        onChange={(y) => update({ y })}
      />
      <SliderField
        label="Width"
        value={op.width}
        min={0.01}
        max={1 - op.x}
        onChange={(width) => update({ width })}
      />
      <SliderField
        label="Height"
        value={op.height}
        min={0.01}
        max={1 - op.y}
        onChange={(height) => update({ height })}
      />
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-base-content/60">
          Pixel size: {op.pixelSize}
        </label>
        <input
          type="range"
          min={2}
          max={100}
          step={1}
          value={op.pixelSize}
          onChange={(e) => update({ pixelSize: parseInt(e.target.value, 10) })}
          className="range range-xs range-primary"
        />
      </div>
    </div>
  );
};
