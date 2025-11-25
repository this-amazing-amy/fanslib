import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ColorPicker } from "./ColorPicker";
import { USER_COLOR_PRESETS } from "~/lib/colors";

const meta: Meta<typeof ColorPicker> = {
  title: "UI/ColorPicker",
  component: ColorPicker,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ColorPicker>;

const ColorPickerWithState = () => {
  const [color, setColor] = useState<string | null>(`preset:${USER_COLOR_PRESETS[0].id}`);
  return (
    <div className="flex items-center gap-4">
      <ColorPicker value={color} onChange={setColor} />
      <span className="text-sm text-base-content/70">Selected: {color ?? 'None'}</span>
    </div>
  );
};

export const Default: Story = {
  render: () => <ColorPickerWithState />,
};

export const AllColors: Story = {
  render: () => (
    <div className="space-y-4">
      <h3 className="font-medium">Available Preset Colors</h3>
      <div className="grid grid-cols-4 gap-3">
        {USER_COLOR_PRESETS.map((preset) => (
          <div key={preset.id} className="flex flex-col items-center gap-1">
            <div
              className="w-10 h-10 rounded-md border-2"
              style={{
                backgroundColor: preset.background,
                borderColor: preset.foreground,
              }}
            />
            <span className="text-xs text-base-content/70">{preset.name}</span>
          </div>
        ))}
      </div>
    </div>
  ),
};
