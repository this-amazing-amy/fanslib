import type { EmojiOperation } from "@fanslib/video/types";
import { useEditorStore } from "~/stores/editorStore";
import { SliderField } from "./slider-field";

export const EmojiProperties = ({ op, opId }: { op: EmojiOperation; opId: string }) => {
  const updateOperationById = useEditorStore((s) => s.updateOperationById);
  const update = (patch: Partial<EmojiOperation>) => updateOperationById(opId, { ...op, ...patch });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-base-content/60">Emoji</label>
        <input
          type="text"
          value={op.emoji}
          onChange={(e) => update({ emoji: e.target.value })}
          className="input input-sm input-bordered w-full bg-base-100 text-2xl"
          maxLength={2}
        />
      </div>
      <SliderField label="X" value={op.x} min={0} max={1} onChange={(x) => update({ x })} />
      <SliderField label="Y" value={op.y} min={0} max={1} onChange={(y) => update({ y })} />
      <SliderField
        label="Size"
        value={op.size}
        min={0.01}
        max={0.5}
        onChange={(size) => update({ size })}
      />
    </div>
  );
};
