import { useCallback, useRef, useState } from "react";
import { Check, ChevronsUpDown, Trash2 } from "lucide-react";
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
import { useSaveSettingsMutation, useSettingsQuery } from "~/lib/queries/settings";
import { CROP_COMPOSITION_WIDTH } from "../../utils/crop-operation";

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

export const CaptionProperties = ({ op, opId }: { op: CaptionOperation; opId: string }) => {
  const presetNameRef = useRef<HTMLInputElement>(null);
  const updateOperationById = useEditorStore((s) => s.updateOperationById);
  const { data: settings } = useSettingsQuery();
  const saveSettings = useSaveSettingsMutation();
  const presets = settings?.captionStylePresets ?? [];

  const update = (patch: Partial<CaptionOperation>) => {
    updateOperationById(opId, { ...op, ...patch });
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
