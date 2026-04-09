import { Button } from "~/components/ui/Button";
import { useEditorStore } from "~/stores/editorStore";
import {
  type CropAspectPreset,
  type CropOperation,
  clampCropRect,
  cropOperationWithPixelRect,
  cropRectPixelsFromOperation,
  MIN_CROP_HEIGHT_PX,
  MIN_CROP_WIDTH_PX,
  CROP_COMPOSITION_HEIGHT,
  CROP_COMPOSITION_WIDTH,
  pixelHeightFromWidthForPreset,
  pixelWidthFromHeightForPreset,
} from "../../utils/crop-operation";

const ASPECT_OPTIONS: CropAspectPreset[] = ["free", "16:9", "9:16", "1:1", "4:5"];

export const CropProperties = ({
  op,
  opId,
  index,
}: {
  op: CropOperation;
  opId: string;
  index: number;
}) => {
  const updateOperationById = useEditorStore((s) => s.updateOperationById);
  const applyCrop = useEditorStore((s) => s.applyCrop);
  const cropEditingOperationId = useEditorStore((s) => s.cropEditingOperationId);

  const canEdit = !op.applied || cropEditingOperationId === opId;
  const showApply = !op.applied || cropEditingOperationId === opId;

  const update = (patch: Partial<CropOperation>) => {
    const next = clampCropRect({ ...op, ...patch });
    updateOperationById(opId, next);
  };

  const updateFromPixels = (pixel: Partial<Record<"xPx" | "yPx" | "wPx" | "hPx", number>>) => {
    updateOperationById(opId, cropOperationWithPixelRect(op, pixel));
  };

  const setAspectPreset = (preset: CropAspectPreset) => {
    if (preset === "free") {
      update({ aspectPreset: "free" });
      return;
    }
    const { xPx, yPx, wPx } = cropRectPixelsFromOperation(op);
    const hFromRatio = pixelHeightFromWidthForPreset(preset, wPx);
    const hPx =
      yPx + hFromRatio > CROP_COMPOSITION_HEIGHT ? CROP_COMPOSITION_HEIGHT - yPx : hFromRatio;
    const xPx2 =
      xPx + wPx > CROP_COMPOSITION_WIDTH ? Math.max(0, CROP_COMPOSITION_WIDTH - wPx) : xPx;
    updateOperationById(
      opId,
      cropOperationWithPixelRect({ ...op, aspectPreset: preset }, { xPx: xPx2, yPx, wPx, hPx }),
    );
  };

  const preset = op.aspectPreset ?? "free";

  const setWidthOrHeightPx = (dim: "width" | "height", v: number) => {
    if (Number.isNaN(v)) return;
    if (preset === "free") {
      updateFromPixels(dim === "width" ? { wPx: v } : { hPx: v });
      return;
    }
    const locked = preset as Exclude<CropAspectPreset, "free">;
    const next =
      dim === "width"
        ? { wPx: v, hPx: pixelHeightFromWidthForPreset(locked, v) }
        : { hPx: v, wPx: pixelWidthFromHeightForPreset(locked, v) };
    updateFromPixels(next);
  };

  const px = cropRectPixelsFromOperation(op);

  return (
    <div className="space-y-4">
      {!canEdit && (
        <p className="text-xs text-base-content/50">
          Use <strong>Edit</strong> on the crop layer to show the full frame and adjust the crop.
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-base-content/60">Aspect lock</label>
        <select
          value={preset}
          onChange={(e) => setAspectPreset(e.target.value as CropAspectPreset)}
          disabled={!canEdit}
          className="select select-sm select-bordered w-full bg-base-100 disabled:opacity-50"
        >
          {ASPECT_OPTIONS.map((ar) => (
            <option key={ar} value={ar}>
              {ar === "free" ? "Free" : ar}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-base-content/50 leading-snug">
        Composition space: {CROP_COMPOSITION_WIDTH}×{CROP_COMPOSITION_HEIGHT} px (same as export).
      </p>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-base-content/60">X (px)</label>
        <input
          type="number"
          step={1}
          min={0}
          max={Math.max(0, CROP_COMPOSITION_WIDTH - px.wPx)}
          value={Math.round(px.xPx)}
          disabled={!canEdit}
          onChange={(e) => {
            const v = Math.round(parseFloat(e.target.value));
            if (Number.isNaN(v)) return;
            updateFromPixels({ xPx: v });
          }}
          className="input input-sm input-bordered w-full bg-base-100 disabled:opacity-50"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-base-content/60">Y (px)</label>
        <input
          type="number"
          step={1}
          min={0}
          max={Math.max(0, CROP_COMPOSITION_HEIGHT - px.hPx)}
          value={Math.round(px.yPx)}
          disabled={!canEdit}
          onChange={(e) => {
            const v = Math.round(parseFloat(e.target.value));
            if (Number.isNaN(v)) return;
            updateFromPixels({ yPx: v });
          }}
          className="input input-sm input-bordered w-full bg-base-100 disabled:opacity-50"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-base-content/60">Width (px)</label>
        <input
          type="number"
          step={1}
          min={MIN_CROP_WIDTH_PX}
          max={CROP_COMPOSITION_WIDTH - px.xPx}
          value={Math.round(px.wPx)}
          disabled={!canEdit}
          onChange={(e) => setWidthOrHeightPx("width", Math.round(parseFloat(e.target.value)))}
          className="input input-sm input-bordered w-full bg-base-100 disabled:opacity-50"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-base-content/60">Height (px)</label>
        <input
          type="number"
          step={1}
          min={MIN_CROP_HEIGHT_PX}
          max={CROP_COMPOSITION_HEIGHT - px.yPx}
          value={Math.round(px.hPx)}
          disabled={!canEdit}
          onChange={(e) => setWidthOrHeightPx("height", Math.round(parseFloat(e.target.value)))}
          className="input input-sm input-bordered w-full bg-base-100 disabled:opacity-50"
        />
      </div>

      {showApply && (
        <Button size="sm" variant="primary" className="w-full" onPress={() => applyCrop(index)}>
          Apply crop
        </Button>
      )}
    </div>
  );
};
