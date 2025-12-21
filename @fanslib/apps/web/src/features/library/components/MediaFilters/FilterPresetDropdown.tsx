import { Bookmark } from "lucide-react";
import { Button } from "~/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuPopover,
  DropdownMenuTrigger,
} from "~/components/ui/DropdownMenu";
import { useFilterPresetContext } from "~/contexts/FilterPresetContext";
import { filtersFromFilterPreset } from "~/features/library/filter-helpers";

type FilterPresetDropdownProps = {
  disabled?: boolean;
  className?: string;
};

export const FilterPresetDropdown = ({
  disabled = false,
  className,
}: FilterPresetDropdownProps) => {
  const { presets, isLoading, applyPreset } = useFilterPresetContext();

  const handleAction = (key: string | number) => {
    const preset = presets.find((p) => p.id === key);
    if (!preset) return;

    const filters = filtersFromFilterPreset(preset);
    applyPreset(filters);
  };

  return (
    <DropdownMenuTrigger>
      <Button
        variant="ghost"
        size="icon"
        isDisabled={disabled || isLoading}
        className={className}
      >
        <Bookmark className="h-4 w-4" />
      </Button>
      <DropdownMenuPopover placement="bottom end">
        <DropdownMenu onAction={handleAction}>
          {presets.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-base-content/60">
              No presets saved yet
            </div>
          ) : (
            presets.map((preset) => (
              <DropdownMenuItem key={preset.id} id={preset.id}>
                {preset.name}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenu>
      </DropdownMenuPopover>
    </DropdownMenuTrigger>
  );
};

