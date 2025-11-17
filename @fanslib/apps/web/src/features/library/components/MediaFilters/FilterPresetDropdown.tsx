import { Bookmark, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPopover,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/DropdownMenu";
import { useFilterPresetContext } from "~/contexts/FilterPresetContext";
import { filtersFromFilterPreset } from "~/features/library/filter-helpers";
import { useMediaFilters } from "./MediaFiltersContext";
import { SavePresetDialog } from "./SavePresetDialog";

type FilterPresetDropdownProps = {
  disabled?: boolean;
};

export const FilterPresetDropdown = ({ disabled = false }: FilterPresetDropdownProps) => {
  const { presets, isLoading, applyPreset } = useFilterPresetContext();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const { filters, hasActiveFilters } = useMediaFilters();

  const handleApplyPreset = (presetId: string) => {
    const preset = presets.find((p) => p.id === presetId);
    if (preset) {
      applyPreset(filtersFromFilterPreset(preset));
    }
  };

  return (
    <>
      <DropdownMenuTrigger>
        <Button variant="ghost" size="icon" className="h-9 w-9" isDisabled={disabled || isLoading}>
          <Bookmark className="h-4 w-4" />
        </Button>
        <DropdownMenuPopover placement="bottom start" className="w-48">
          <DropdownMenu
            onAction={(key) => {
              if (key === "save") {
                setShowSaveDialog(true);
              } else {
                handleApplyPreset(key as string);
              }
            }}
          >
            <DropdownMenuLabel>Filter Presets</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {hasActiveFilters && (
              <>
                <DropdownMenuItem id="save" className="cursor-pointer">
                  <Plus className="mr-2 h-4 w-4" />
                  Save Current Filters
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            {presets.length === 0 ? (
              <DropdownMenuItem id="empty" isDisabled>
                No presets saved
              </DropdownMenuItem>
            ) : (
              presets.map((preset) => (
                <DropdownMenuItem key={preset.id} id={preset.id} className="cursor-pointer">
                  <Bookmark className="mr-2 h-4 w-4" />
                  {preset.name}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenu>
        </DropdownMenuPopover>
      </DropdownMenuTrigger>

      <SavePresetDialog open={showSaveDialog} onOpenChange={setShowSaveDialog} filters={filters} />
    </>
  );
};
