import { useState } from "react";
import { Button } from "~/components/ui/Button/Button";
import { Popover, PopoverTrigger } from "~/components/ui/Popover/Popover";
import { cn } from "~/lib/cn";

export const PRESET_EMOJIS = [
  // Smileys
  "😊",
  "😂",
  "🥰",
  "😎",
  "🤩",
  "😴",
  "🤔",
  "😅",
  "🥳",
  "😇",
  // Objects
  "📅",
  "📆",
  "🗓️",
  "⏰",
  "🔔",
  "📌",
  "💡",
  "🎯",
  "🚀",
  "⭐",
  // Nature
  "🌸",
  "🌺",
  "🌻",
  "🍀",
  "🌙",
  "☀️",
  "🔥",
  "💧",
  "❄️",
  "🌈",
  // Food
  "🍕",
  "🍔",
  "🍩",
  "🍷",
  "☕",
  "🍓",
  "🍑",
  "🍒",
  "🥑",
  "🧁",
  // Activities
  "🎨",
  "🎬",
  "🎵",
  "🎮",
  "💃",
  "🏃",
  "💪",
  "🧘",
  "🎉",
  "🎁",
  // Symbols
  "❤️",
  "💜",
  "💙",
  "💚",
  "💛",
  "🧡",
  "✨",
  "💫",
  "🏆",
  "👑",
] as const;

type EmojiPickerProps = {
  value: string;
  onChange: (emoji: string) => void;
  placeholder?: string;
  className?: string;
};

export const EmojiPicker = ({
  value,
  onChange,
  placeholder = "😊",
  className,
}: EmojiPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleEmojiSelect = (emoji: string) => {
    onChange(emoji);
    setIsOpen(false);
  };

  return (
    <PopoverTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button
        variant="ghost"
        className={cn("w-10 h-10 p-0 text-xl border border-base-content rounded-full", className)}
        aria-label="Select emoji"
      >
        {value || placeholder}
      </Button>
      <Popover className="p-3">
        <div className="grid grid-cols-10 gap-1">
          {PRESET_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleEmojiSelect(emoji)}
              className={cn(
                "w-8 h-8 rounded-md text-lg flex items-center justify-center transition-colors hover:bg-base-200 focus:outline-none focus:ring-2 focus:ring-primary",
                value === emoji && "bg-base-200 ring-2 ring-primary",
              )}
              aria-label={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </Popover>
    </PopoverTrigger>
  );
};
