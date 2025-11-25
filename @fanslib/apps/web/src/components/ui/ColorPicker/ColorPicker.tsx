import { useState } from "react";
import { Button } from "~/components/ui/Button/Button";
import { Popover, PopoverTrigger } from "~/components/ui/Popover/Popover";
import { cn } from "~/lib/cn";
import { USER_COLOR_PRESETS, getColorDefinitionFromString } from "~/lib/colors";

type ColorPickerProps = {
  value: string | null;
  onChange: (color: string | null) => void;
  className?: string;
};

export const ColorPicker = ({ value, onChange, className }: ColorPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleColorSelect = (presetId: string) => {
    onChange(`preset:${presetId}`);
    setIsOpen(false);
  };

  // Get the display color for the button
  const colorDef = getColorDefinitionFromString(value, 0);
  const displayColor = colorDef.background;

  // Determine which preset is selected
  const selectedPresetId = value?.startsWith('preset:') ? value.substring(7) : null;

  return (
    <PopoverTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button
        variant="ghost"
        className={cn("w-10 h-10 p-0 rounded border-2", className)}
        style={{
          backgroundColor: displayColor,
          borderColor: colorDef.foreground,
        }}
        aria-label="Select color"
      >
        <span className="sr-only">Select color</span>
      </Button>
      <Popover className="p-3">
        <div className="grid grid-cols-4 gap-2">
          {USER_COLOR_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleColorSelect(preset.id)}
              className={cn(
                "w-8 h-8 rounded-md border-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
                selectedPresetId === preset.id ? "ring-2 ring-offset-1" : ""
              )}
              style={{
                backgroundColor: preset.background,
                borderColor: selectedPresetId === preset.id ? preset.foreground : 'transparent',
              }}
              aria-label={preset.name}
              title={preset.name}
            />
          ))}
        </div>
      </Popover>
    </PopoverTrigger>
  );
};
