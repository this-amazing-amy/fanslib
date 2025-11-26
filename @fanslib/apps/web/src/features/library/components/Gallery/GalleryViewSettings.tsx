import { Settings2 } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { Popover, PopoverTrigger } from "~/components/ui/Popover";
import { ToggleGroup } from "~/components/ui/ToggleGroup";
import type { GridSize } from "~/contexts/LibraryPreferencesContext";
import { useLibraryPreferences } from "~/contexts/LibraryPreferencesContext";

export const GalleryViewSettings = () => {
  const { preferences, updatePreferences } = useLibraryPreferences();

  return (
    <PopoverTrigger>
      <Button variant="ghost" size="icon" className="h-9 w-9">
        <Settings2 className="h-4 w-4" />
      </Button>
      <Popover placement="bottom end" className="w-56">
        <div className="space-y-3">
          <div className="text-sm font-semibold">View Settings</div>
          <div className="border-t border-base-content/20" />
          <div className="space-y-2">
            <div className="text-sm font-medium">Grid Size</div>
            <ToggleGroup
              options={[{ value: "small", label: "Small" }, { value: "large", label: "Large" }]}
              value={preferences.view.gridSize}
              aria-label="Grid size"
              onChange={(value) => {
                if (!value) return;
                updatePreferences({ view: { gridSize: value as GridSize } });
              }}
            >
            </ToggleGroup>
          </div>
        </div>
      </Popover>
    </PopoverTrigger>
  );
};
