import { useCallback, useRef, useState } from "react";
import { Check, ChevronsUpDown, Settings2, Trash2 } from "lucide-react";
import { getAvailableFonts } from "@remotion/google-fonts";
import type { CaptionOperation } from "@fanslib/video/types";
import type { CaptionStylePreset } from "@fanslib/server/schemas";
import { Button } from "~/components/ui/Button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "~/components/ui/Command";
import { Input } from "~/components/ui/Input";
import { Textarea } from "~/components/ui/Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/Select";
import { useEditorStore } from "~/stores/editorStore";
import { useAssetsQuery } from "~/lib/queries/assets";
import { useSaveSettingsMutation, useSettingsQuery } from "~/lib/queries/settings";
import { isCaptionOperation } from "../utils/caption-layout";
import {
  type CropAspectPreset,
  type CropOperation,
  clampCropRect,
  cropOperationWithPixelRect,
  cropRectPixelsFromOperation,
  isCropOperation,
  MIN_CROP_HEIGHT_PX,
  MIN_CROP_WIDTH_PX,
  CROP_COMPOSITION_HEIGHT,
  CROP_COMPOSITION_WIDTH,
  pixelHeightFromWidthForPreset,
  pixelWidthFromHeightForPreset,
} from "../utils/crop-operation";

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

const ASPECT_OPTIONS: CropAspectPreset[] = ["free", "16:9", "9:16", "1:1", "4:5"];

const availableFonts = getAvailableFonts();

const FontFamilyPicker = ({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (family: string | undefined) => void;
}) => {
  const [open, setOpen] = useState(false);

  const selectFont = useCallback(
    (fontFamily: string) => {
      onChange(fontFamily);
      setOpen(false);
      const font = availableFonts.find((f: { fontFamily: string }) => f.fontFamily === fontFamily);
      if (font) {
        font.load().then((loaded: { loadFont: () => void }) => loaded.loadFont());
      }
    },
    [onChange],
  );

  return (
    <div className="flex flex-col gap-1 relative">
      <label className="text-xs font-medium text-base-content/60">Font family</label>
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-between"
        onPress={() => setOpen((o) => !o)}
      >
        <span className="truncate">{value || "sans-serif"}</span>
        <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-[79]" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 z-[80] mt-1">
            <Command className="max-h-64 overflow-y-auto border-2 border-base-content">
              <CommandInput placeholder="Search fonts..." />
              <CommandEmpty>No font found.</CommandEmpty>
              <CommandGroup>
                {availableFonts.map((f) => (
                  <CommandItem
                    key={f.importName}
                    value={f.fontFamily}
                    onSelect={() => selectFont(f.fontFamily)}
                  >
                    <Check
                      className={`mr-2 h-3 w-3 ${value === f.fontFamily ? "opacity-100" : "opacity-0"}`}
                    />
                    {f.fontFamily}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </div>
        </>
      )}
    </div>
  );
};

const CAPTION_ANIMATIONS: CaptionOperation["animation"][] = [
  "fade-in",
  "scale-in",
  "slide-up",
  "typewriter",
];

const CaptionProperties = ({ op, index }: { op: CaptionOperation; index: number }) => {
  const presetNameRef = useRef<HTMLInputElement>(null);
  const updateOperation = useEditorStore((s) => s.updateOperation);
  const { data: settings } = useSettingsQuery();
  const saveSettings = useSaveSettingsMutation();
  const presets = settings?.captionStylePresets ?? [];

  const update = (patch: Partial<CaptionOperation>) => {
    updateOperation(index, { ...op, ...patch });
  };

  const applyPresetById = (id: string) => {
    const p = presets.find((x) => x.id === id);
    if (!p) return;
    update({
      fontSize: p.fontSize,
      fontFamily: p.fontFamily,
      color: p.color,
      strokeColor: p.strokeColor,
      strokeWidth: p.strokeWidth,
      animation: p.animation,
    });
  };

  const saveCurrentAsPreset = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const next: CaptionStylePreset = {
      id: crypto.randomUUID(),
      name: trimmed,
      fontSize: op.fontSize,
      fontFamily: op.fontFamily,
      color: op.color,
      strokeColor: op.strokeColor,
      strokeWidth: op.strokeWidth,
      animation: op.animation,
    };
    saveSettings.mutate({ captionStylePresets: [...presets, next] });
  };

  const removePreset = (id: string) => {
    saveSettings.mutate({
      captionStylePresets: presets.filter((p) => p.id !== id),
    });
  };

  const fontSizePx = Math.round(op.fontSize * CROP_COMPOSITION_WIDTH);

  const setFontSizePx = (px: number) => {
    if (Number.isNaN(px)) return;
    update({
      fontSize: Math.max(1, Math.min(px, CROP_COMPOSITION_WIDTH)) / CROP_COMPOSITION_WIDTH,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-base-content/60">Text</label>
        <Textarea
          value={op.text}
          onChange={(v) => update({ text: v })}
          rows={3}
          className="text-sm"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-base-content/60">Presets</label>
        <select
          className="select select-sm select-bordered w-full bg-base-100"
          defaultValue=""
          onChange={(e) => {
            const id = e.target.value;
            if (id) applyPresetById(id);
            e.target.value = "";
          }}
        >
          <option value="">Apply preset…</option>
          {presets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <div className="flex gap-2 items-center">
          <input
            ref={presetNameRef}
            type="text"
            placeholder="Name"
            className="input input-sm input-bordered flex-1 bg-base-100"
          />
          <Button
            size="sm"
            variant="secondary"
            onPress={() => {
              saveCurrentAsPreset(presetNameRef.current?.value ?? "");
              if (presetNameRef.current) presetNameRef.current.value = "";
            }}
          >
            Save
          </Button>
        </div>
        {presets.length > 0 && (
          <ul className="text-xs space-y-1 max-h-24 overflow-y-auto">
            {presets.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-2 text-base-content/80"
              >
                <span className="truncate">{p.name}</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs btn-square text-error"
                  aria-label={`Delete preset ${p.name}`}
                  onClick={() => removePreset(p.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-base-content/60">Font size (px)</label>
        <Input
          type="number"
          step={1}
          min={1}
          max={CROP_COMPOSITION_WIDTH}
          value={String(fontSizePx)}
          onChange={(v) => setFontSizePx(Math.round(parseFloat(v)))}
        />
      </div>

      <FontFamilyPicker
        value={op.fontFamily}
        onChange={(family) => update({ fontFamily: family })}
      />

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-base-content/60">Color</label>
        <input
          type="color"
          value={/^#[0-9A-Fa-f]{6}$/.test(op.color) ? op.color : "#ffffff"}
          onChange={(e) => update({ color: e.target.value })}
          className="input input-sm h-9 w-full bg-base-100 cursor-pointer"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-base-content/60">Stroke color</label>
        <input
          type="color"
          value={
            op.strokeColor && /^#[0-9A-Fa-f]{6}$/.test(op.strokeColor) ? op.strokeColor : "#000000"
          }
          onChange={(e) => update({ strokeColor: e.target.value })}
          className="input input-sm h-9 w-full bg-base-100 cursor-pointer"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-base-content/60">Stroke width (px)</label>
        <Input
          type="number"
          step={0.5}
          min={0}
          max={20}
          value={String(op.strokeWidth ?? 0)}
          onChange={(v) => {
            const n = parseFloat(v);
            if (Number.isNaN(n)) return;
            update({ strokeWidth: n === 0 ? undefined : n });
          }}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-base-content/60">Animation</label>
        <Select
          value={op.animation}
          onValueChange={(v) => update({ animation: v as CaptionOperation["animation"] })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Animation" />
          </SelectTrigger>
          <SelectContent>
            {CAPTION_ANIMATIONS.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-base-content/60">Start frame</label>
        <Input
          type="number"
          step={1}
          min={0}
          value={String(op.startFrame)}
          onChange={(v) => {
            const n = parseInt(v, 10);
            if (Number.isNaN(n)) return;
            update({ startFrame: n });
          }}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-base-content/60">End frame</label>
        <Input
          type="number"
          step={1}
          min={0}
          value={String(op.endFrame)}
          onChange={(v) => {
            const n = parseInt(v, 10);
            if (Number.isNaN(n)) return;
            update({ endFrame: n });
          }}
        />
      </div>

      <p className="text-xs text-base-content/50">
        With video, press I / O to set start and end to the current frame (when clip mode is off).
      </p>
    </div>
  );
};

const CropProperties = ({ op, index }: { op: CropOperation; index: number }) => {
  const updateOperation = useEditorStore((s) => s.updateOperation);
  const applyCrop = useEditorStore((s) => s.applyCrop);
  const cropEditingOperationIndex = useEditorStore((s) => s.cropEditingOperationIndex);

  const canEdit = !op.applied || cropEditingOperationIndex === index;
  const showApply = !op.applied || cropEditingOperationIndex === index;

  const update = (patch: Partial<CropOperation>) => {
    const next = clampCropRect({ ...op, ...patch });
    updateOperation(index, next);
  };

  const updateFromPixels = (pixel: Partial<Record<"xPx" | "yPx" | "wPx" | "hPx", number>>) => {
    updateOperation(index, cropOperationWithPixelRect(op, pixel));
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
    updateOperation(
      index,
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

const WatermarkProperties = ({ op, index }: { op: WatermarkOp; index: number }) => {
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
        {isWatermarkOp(op)
          ? "Watermark"
          : isCropOperation(op)
            ? "Crop"
            : isCaptionOperation(op)
              ? "Caption"
              : String((op as Record<string, unknown>).type ?? "Properties")}
      </h3>

      {isWatermarkOp(op) ? (
        <WatermarkProperties op={op} index={selectedIndex} />
      ) : isCropOperation(op) ? (
        <CropProperties op={op} index={selectedIndex} />
      ) : isCaptionOperation(op) ? (
        <CaptionProperties op={op} index={selectedIndex} />
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
