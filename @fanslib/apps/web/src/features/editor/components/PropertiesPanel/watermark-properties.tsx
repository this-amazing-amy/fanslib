import { useEditorStore } from "~/stores/editorStore";
import { useAssetsQuery } from "~/lib/queries/assets";
import { isWatermarkOp, type WatermarkOp } from "../EditorCanvas/helpers";

export { isWatermarkOp };

export const WatermarkProperties = ({ op, opId }: { op: WatermarkOp; opId: string }) => {
  const updateOperationById = useEditorStore((s) => s.updateOperationById);
  const { data: assets } = useAssetsQuery("image");

  const update = (patch: Partial<WatermarkOp>) => {
    updateOperationById(opId, { ...op, ...patch });
  };

  return (
    <div className="space-y-4">
      {/* Asset preview */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-base-content/60">Preview</label>
        <img
          src={`/api/assets/${op.assetId}/file`}
          alt="Watermark preview"
          className="w-full h-24 object-contain rounded border border-base-300 bg-base-300/50"
        />
      </div>

      {/* Asset picker */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-base-content/60">Asset</label>
        <select
          value={op.assetId}
          onChange={(e) => update({ assetId: e.target.value })}
          className="select select-sm select-bordered w-full bg-base-100"
        >
          {assets?.map((asset) => (
            <option key={asset.id} value={asset.id}>
              {asset.name}
            </option>
          ))}
        </select>
      </div>

      {/* X position */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-base-content/60">
          X Position: {op.x.toFixed(2)}
        </label>
        <input
          type="range"
          min={0}
          max={Math.max(0, 1 - op.width)}
          step={0.01}
          value={op.x}
          onChange={(e) => update({ x: parseFloat(e.target.value) })}
          className="range range-xs range-primary"
        />
      </div>

      {/* Y position */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-base-content/60">
          Y Position: {op.y.toFixed(2)}
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={op.y}
          onChange={(e) => update({ y: parseFloat(e.target.value) })}
          className="range range-xs range-primary"
        />
      </div>

      {/* Width */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-base-content/60">
          Width: {op.width.toFixed(2)}
        </label>
        <input
          type="range"
          min={0.01}
          max={Math.max(0.01, 1 - op.x)}
          step={0.01}
          value={op.width}
          onChange={(e) => update({ width: parseFloat(e.target.value) })}
          className="range range-xs range-primary"
        />
      </div>

      {/* Opacity */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-base-content/60">
          Opacity: {op.opacity.toFixed(2)}
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={op.opacity}
          onChange={(e) => update({ opacity: parseFloat(e.target.value) })}
          className="range range-xs range-primary"
        />
      </div>
    </div>
  );
};
