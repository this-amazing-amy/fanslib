import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { EmojiPicker, PRESET_EMOJIS } from "./EmojiPicker";

const meta: Meta<typeof EmojiPicker> = {
  title: "UI/EmojiPicker",
  component: EmojiPicker,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof EmojiPicker>;

const EmojiPickerWithState = () => {
  const [emoji, setEmoji] = useState<string>("📅");
  return (
    <div className="flex items-center gap-4">
      <EmojiPicker value={emoji} onChange={setEmoji} />
      <span className="text-sm text-base-content/70">Selected: {emoji}</span>
    </div>
  );
};

export const Default: Story = {
  render: () => <EmojiPickerWithState />,
};

const EmptyEmojiPicker = () => {
  const [emoji, setEmoji] = useState<string>("");
  return <EmojiPicker value={emoji} onChange={setEmoji} placeholder="😊" />;
};

export const Empty: Story = {
  render: () => <EmptyEmojiPicker />,
};

export const AllEmojis: Story = {
  render: () => (
    <div className="space-y-4">
      <h3 className="font-medium">Available Preset Emojis ({PRESET_EMOJIS.length})</h3>
      <div className="grid grid-cols-10 gap-2">
        {PRESET_EMOJIS.map((emoji) => (
          <div
            key={emoji}
            className="w-8 h-8 flex items-center justify-center text-lg"
          >
            {emoji}
          </div>
        ))}
      </div>
    </div>
  ),
};
