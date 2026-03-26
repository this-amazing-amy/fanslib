import { Settings2 } from "lucide-react";
import { useEditorStore } from "~/stores/editorStore";
import { useAssetsQuery } from "~/lib/queries/assets";

type WatermarkOp = {
  type: "watermark";
  assetId: string;
  x: number;
  y: number;
  width: number;
  opacity: number;
};

const isWatermarkOp = (op: unknown): op is WatermarkOp =>
  typeof op === "object" &&
  op !== null &&
  "type" in op &&
  (op as { type: string }).type === "watermark";

const WatermarkProperties = ({
  op,
  index,
}: {
  op: WatermarkOp;
  index: number;
}) => {
  const updateOperation = useEditorStore((s) => s.updateOperation);
  const { data: assets } = useAssetsQuery("image");

  const update = (patch: Partial<WatermarkOp>) => {
    updateOperation(index, { ...op, ...patch });
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
          max={1}
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
          min={0}
          max={1}
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

export const PropertiesPanel = () => {
  const operations = useEditorStore((s) => s.operations);
  const selectedIndex = useEditorStore((s) => s.selectedOperationIndex);

  if (selectedIndex === null || selectedIndex >= operations.length) {
    return (
      <div className="w-72 border-l border-base-300 bg-base-200/30 p-4 flex flex-col items-center justify-center text-base-content/40">
        <Settings2 className="h-8 w-8 mb-2" />
        <p className="text-sm text-center">Select an operation to edit its properties</p>
      </div>
    );
  }

  const op = operations[selectedIndex];

  return (
    <div className="w-72 border-l border-base-300 bg-base-200/30 p-4 overflow-y-auto">
      <h3 className="text-sm font-semibold mb-3 capitalize">
        {isWatermarkOp(op) ? "Watermark" : String((op as Record<string, unknown>).type ?? "Properties")}
      </h3>

      {isWatermarkOp(op) ? (
        <WatermarkProperties op={op} index={selectedIndex} />
      ) : (
        <div className="space-y-3 text-sm">
          {Object.entries(op as Record<string, unknown>)
            .filter(([key]) => key !== "type")
            .map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-base-content/60 capitalize">{key}</span>
                <span className="font-mono text-xs">{String(value)}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
